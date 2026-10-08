#!/usr/bin/env node
/**
 * Fails the publish if a node or credential icon would not render in n8n.
 *
 * Runs against the built package (dist/), the same files npm publishes, so it
 * catches what n8n's review saw in 1.4.0: an icon file that existed but was
 * corrupted (a PNG whose binary bytes had been rewritten as text). It also
 * rejects an SVG without a square viewBox, which n8n draws at ~40px by
 * cropping the top-left corner of the canvas instead of scaling it.
 *
 * Run: npm run build && npm run check:icons
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require(path.join(ROOT, 'package.json'));
const errors = [];

function iconsOf(entryFile, kind) {
	const mod = require(path.join(ROOT, entryFile));
	const Cls = Object.values(mod).find((v) => typeof v === 'function');
	if (!Cls) {
		errors.push(`${entryFile}: no exported class`);
		return [];
	}
	const instance = new Cls();
	const icon = kind === 'node' ? instance.description && instance.description.icon : instance.icon;
	if (!icon) {
		errors.push(`${entryFile}: ${kind} has no icon`);
		return [];
	}
	if (typeof icon === 'string') {
		errors.push(`${entryFile}: icon must define light and dark variants, got a single "${icon}"`);
		return [icon];
	}
	if (!icon.light || !icon.dark) {
		errors.push(`${entryFile}: icon must define both light and dark`);
	}
	return [icon.light, icon.dark].filter(Boolean);
}

function checkSvg(file, label) {
	const text = fs.readFileSync(file, 'utf8');
	const root = text.replace(/^﻿?\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*/, '');
	if (!root.startsWith('<svg')) {
		errors.push(`${label}: not an SVG document`);
		return;
	}
	const svgTag = root.slice(0, root.indexOf('>') + 1);
	const viewBox = /viewBox="([^"]+)"/.exec(svgTag);
	if (!viewBox) {
		errors.push(`${label}: <svg> has no viewBox, so it will not scale to n8n's icon size`);
	} else {
		const [, , w, h] = viewBox[1].trim().split(/[\s,]+/).map(Number);
		if (!(w > 0 && h > 0)) errors.push(`${label}: invalid viewBox "${viewBox[1]}"`);
		else if (Math.abs(w - h) > 0.01 * Math.max(w, h)) {
			errors.push(`${label}: viewBox is ${w}x${h}; n8n icons must be square`);
		}
	}
	if (/<script|<foreignObject|\son[a-z]+\s*=/i.test(text)) {
		errors.push(`${label}: contains scripts or embedded HTML`);
	}
	if (!/<\/svg>\s*$/.test(text)) errors.push(`${label}: SVG is truncated (no closing </svg>)`);
}

function checkPng(file, label) {
	const signature = fs.readFileSync(file).subarray(0, 8);
	if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
		errors.push(`${label}: not a valid PNG (bad signature ${signature.toString('hex')}); the file is corrupted`);
	}
}

const entries = [
	...(pkg.n8n.nodes || []).map((f) => [f, 'node']),
	...(pkg.n8n.credentials || []).map((f) => [f, 'credential']),
];
let checked = 0;
for (const [entryFile, kind] of entries) {
	if (!fs.existsSync(path.join(ROOT, entryFile))) {
		errors.push(`${entryFile}: missing; run npm run build first`);
		continue;
	}
	for (const icon of iconsOf(entryFile, kind)) {
		if (typeof icon !== 'string' || !icon.startsWith('file:')) {
			errors.push(`${entryFile}: icon "${icon}" must use the file: protocol`);
			continue;
		}
		const file = path.resolve(path.dirname(path.join(ROOT, entryFile)), icon.slice('file:'.length));
		const label = `${kind} ${path.relative(ROOT, file)}`;
		if (!file.startsWith(path.join(ROOT, 'dist') + path.sep)) {
			errors.push(`${label}: outside dist/, so it is not published`);
		} else if (!fs.existsSync(file)) {
			errors.push(`${label}: file does not exist`);
		} else if (file.endsWith('.svg')) {
			checkSvg(file, label);
		} else if (file.endsWith('.png')) {
			checkPng(file, label);
		} else {
			errors.push(`${label}: icons must be .svg or .png`);
		}
		checked++;
	}
}

if (errors.length) {
	for (const e of errors) console.error(`ERROR: ${e}`);
	console.error(`\n${errors.length} icon problem(s); not publishing.`);
	process.exit(1);
}
console.log(`All ${checked} icon references resolve to valid, square icons.`);
