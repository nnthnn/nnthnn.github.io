// Each viz is registered with the engine via registerViz().
// Engine globals available: ctx, W, H, getFFT(n), getWave(), NBAR
// draw(ctx, W, H, state)      — called each frame by loop()
// preview(ctx, W, H, t, state) — called by the style picker cards (synthetic, no analyser)

registerViz({
	id: "bars",
	label: "BARS",
	draw(ctx, W, H, state) {
		ctx.fillStyle = "rgba(0,0,0,0.85)";
		ctx.fillRect(0, 0, W, H);

		ctx.strokeStyle = "rgba(0,255,65,0.05)";
		ctx.lineWidth = 0.5;
		for (let i = 1; i < 4; i++) {
			ctx.beginPath();
			ctx.moveTo(0, (H / 4) * i);
			ctx.lineTo(W, (H / 4) * i);
			ctx.stroke();
		}

		const fft = getFFT(NBAR + 1);
		const bw = W / NBAR;
		if (!state.peaks) {
			state.peaks = new Float32Array(NBAR).fill(0);
			state.peakVel = new Float32Array(NBAR).fill(0);
		}

		for (let i = 0; i < NBAR; i++) {
			const v = Math.min(1, fft[i + 1]);
			const bh = v * H * 0.94;
			const x = i * bw;
			const hue = v > 0.8 ? 0 : v > 0.5 ? 30 : 120;
			const lit = 50 + v * 15;

			const grad = ctx.createLinearGradient(0, H, 0, H - bh);
			grad.addColorStop(0, `hsla(${hue},100%,${lit}%,0.9)`);
			grad.addColorStop(
				0.6,
				`hsla(${Math.max(0, hue - 20)},100%,${lit + 10}%,0.7)`,
			);
			grad.addColorStop(1, `hsla(180,100%,70%,0.4)`);
			ctx.fillStyle = grad;
			ctx.fillRect(x + 1, H - bh, bw - 2, bh);

			ctx.fillStyle = `hsla(${hue},100%,${lit}%,0.08)`;
			ctx.fillRect(x + 1, H, bw - 2, Math.min(bh * 0.3, 30));

			if (v > state.peaks[i]) {
				state.peaks[i] = v;
				state.peakVel[i] = 0;
			} else {
				state.peakVel[i] += 0.002;
				state.peaks[i] = Math.max(0, state.peaks[i] - state.peakVel[i]);
			}
			const ph = state.peaks[i] * H * 0.94;
			ctx.fillStyle =
				state.peaks[i] > 0.8
					? "#ff2d78"
					: state.peaks[i] > 0.5
						? "#ff6b00"
						: "#00ff41";
			ctx.shadowColor = ctx.fillStyle;
			ctx.shadowBlur = 4;
			ctx.fillRect(x + 1, H - ph - 2, bw - 2, 2);
			ctx.shadowBlur = 0;
		}
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const N = 24;
		for (let i = 0; i < N; i++) {
			const v =
				0.4 + 0.4 * Math.sin(t * 2 + i * 0.4) * Math.sin(t * 0.7 + i * 0.15);
			ctx.fillStyle = `hsl(${90 + i * 3},100%,50%)`;
			ctx.fillRect(i * (W / N), H - v * H, W / N - 1, v * H);
		}
	},
});

registerViz({
	id: "scope",
	label: "SCOPE",
	draw(ctx, W, H) {
		ctx.fillStyle = "rgba(0,0,0,0.12)";
		ctx.fillRect(0, 0, W, H);

		const wave = getWave();
		const step = wave.length / W;

		ctx.strokeStyle = "rgba(0,255,65,0.08)";
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		ctx.moveTo(0, H / 2);
		ctx.lineTo(W, H / 2);
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "rgba(0,255,65,0.15)";
		ctx.lineWidth = 6;
		for (let x = 0; x < W; x++) {
			const y = H / 2 + wave[Math.floor(x * step)] * H * 0.44;
			x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "#00ff41";
		ctx.lineWidth = 1.5;
		ctx.shadowColor = "#00ff41";
		ctx.shadowBlur = 8;
		for (let x = 0; x < W; x++) {
			const y = H / 2 + wave[Math.floor(x * step)] * H * 0.44;
			x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.shadowBlur = 0;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		ctx.strokeStyle = "#00ff41";
		ctx.lineWidth = 1.5;
		ctx.shadowColor = "#00ff41";
		ctx.shadowBlur = 4;
		ctx.beginPath();
		for (let x = 0; x < W; x++) {
			const v =
				Math.sin(x * 0.12 + t * 3) * 0.3 + Math.sin(x * 0.05 + t * 1.7) * 0.2;
			const y = H / 2 + v * H * 0.8;
			x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.shadowBlur = 0;
	},
});

registerViz({
	id: "fire",
	label: "FIRE",
	draw(ctx, W, H, state) {
		if (!state.pixels || state.pixels.length !== W * (H + 2)) {
			state.pixels = new Uint8Array(W * (H + 2));
		}
		const fft = getFFT(W);
		for (let x = 0; x < W; x++) {
			const v = fft[x];
			state.pixels[(H + 1) * W + x] = Math.floor(v * 240 + 10);
			state.pixels[H * W + x] = Math.floor(v * 200);
		}
		for (let y = H - 1; y >= 0; y--) {
			for (let x = 0; x < W; x++) {
				const sum =
					state.pixels[(y + 1) * W + x] +
					state.pixels[(y + 1) * W + ((x - 1 + W) % W)] +
					state.pixels[(y + 1) * W + ((x + 1) % W)] +
					(y + 2 <= H ? state.pixels[(y + 2) * W + x] : 0);
				state.pixels[y * W + x] = sum < 4.06 ? 0 : Math.floor(sum / 4.06);
			}
		}
		const img = ctx.createImageData(W, H);
		for (let i = 0; i < W * H; i++) {
			const v = state.pixels[i];
			img.data[i * 4] = Math.min(255, v * 3);
			img.data[i * 4 + 1] = Math.max(0, Math.min(255, v * 2 - 180));
			img.data[i * 4 + 2] = Math.max(0, v - 220) * 8;
			img.data[i * 4 + 3] = v > 0 ? 255 : 0;
		}
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		ctx.putImageData(img, 0, 0);
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const rows = 20,
			cols = 24;
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				const heat =
					Math.max(0, 1 - y / rows) *
					(0.5 + 0.5 * Math.sin(t * 2 + x * 0.5 + y * 0.3));
				ctx.fillStyle = `rgb(${Math.floor(heat * 255)},${Math.floor(Math.max(0, heat - 0.5) * 255)},0)`;
				ctx.fillRect(x * (W / cols), y * (H / rows), W / cols, H / rows);
			}
		}
	},
});

registerViz({
	id: "milkdrop",
	label: "MILKDROP",
	draw(ctx, W, H, state) {
		ctx.fillStyle = "rgba(0,0,0,0.1)";
		ctx.fillRect(0, 0, W, H);
		const fft = getFFT(32);
		const bass = (fft[5] + fft[6] + fft[7] + fft[8]) / 4;
		const mid = fft[14];
		const high = fft[26];
		if (!state.t) state.t = 0;

		const colors = ["#00ff41", "#00eeff", "#ff2d78", "#ff6b00"];
		for (let ring = 0; ring < 4; ring++) {
			const rad = (40 + ring * 55) * (0.7 + bass * 0.8 + mid * 0.2);
			const n = 4 + ring * 2;
			ctx.beginPath();
			for (let i = 0; i <= n * 8; i++) {
				const a = (i / (n * 8)) * Math.PI * 2;
				const freq = ring < 2 ? bass : ring === 2 ? mid : high;
				const warp =
					1 + 0.35 * Math.sin(n * a + state.t * (0.8 + ring * 0.5)) * freq;
				const r2 = rad * warp * (1 + 0.1 * Math.sin(state.t * 1.3 + ring));
				ctx.lineTo(W / 2 + Math.cos(a) * r2, H / 2 + Math.sin(a) * r2);
			}
			ctx.closePath();
			ctx.strokeStyle = colors[ring];
			ctx.lineWidth = 1.2;
			ctx.shadowColor = colors[ring];
			ctx.shadowBlur = 6;
			ctx.stroke();
			ctx.shadowBlur = 0;
		}
		state.t += 0.03;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "rgba(0,0,0,0.15)";
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2,
			cy = H / 2;
		for (let i = 0; i < 6; i++) {
			const r = 8 + i * 7 + 4 * Math.sin(t * 1.5 + i);
			const hue = (t * 60 + i * 45) % 360;
			ctx.strokeStyle = `hsl(${hue},100%,60%)`;
			ctx.lineWidth = 1;
			ctx.shadowColor = `hsl(${hue},100%,60%)`;
			ctx.shadowBlur = 6;
			ctx.beginPath();
			ctx.arc(
				cx + Math.sin(t + i) * 10,
				cy + Math.cos(t * 0.7 + i) * 8,
				r,
				0,
				Math.PI * 2,
			);
			ctx.stroke();
		}
		ctx.shadowBlur = 0;
	},
});

registerViz({
	id: "rings",
	label: "RINGS",
	draw(ctx, W, H, state) {
		ctx.fillStyle = "rgba(0,0,0,0.2)";
		ctx.fillRect(0, 0, W, H);
		if (!state.t) state.t = 0;
		const fft = getFFT(64);
		const cx = W / 2,
			cy = H / 2;
		const maxR = Math.min(W, H) * 0.45;
		for (let i = 0; i < 64; i++) {
			const v = fft[Math.floor((i * fft.length) / 64)];
			const r = (i / 64) * maxR;
			const hue = (i / 64) * 180 + state.t * 20;
			ctx.beginPath();
			ctx.arc(cx, cy, r + v * 30, 0, Math.PI * 2);
			ctx.strokeStyle = `hsla(${hue},100%,60%,${v * 0.8 + 0.05})`;
			ctx.lineWidth = 0.5 + v * 2;
			ctx.shadowColor = `hsl(${hue},100%,60%)`;
			ctx.shadowBlur = v * 8;
			ctx.stroke();
			ctx.shadowBlur = 0;
		}
		state.t += 0.01;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2,
			cy = H / 2;
		for (let i = 0; i < 5; i++) {
			const r = 8 + i * 9 + 3 * Math.sin(t * 1.2 + i * 0.6);
			const hue = (180 + i * 36 + t * 40) % 360;
			ctx.strokeStyle = `hsl(${hue},90%,55%)`;
			ctx.lineWidth = 2;
			ctx.shadowColor = `hsl(${hue},90%,55%)`;
			ctx.shadowBlur = 5;
			ctx.beginPath();
			ctx.arc(cx, cy, r, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.shadowBlur = 0;
	},
});

registerViz({
	id: "waterfall",
	label: "WATERFALL",
	draw(ctx, W, H, state) {
		if (!state.buf || state.buf.data.length !== W * H * 4) {
			state.buf = ctx.createImageData(W, H);
			for (let i = 3; i < state.buf.data.length; i += 4)
				state.buf.data[i] = 255;
		}
		state.buf.data.copyWithin(W * 4, 0, W * (H - 1) * 4);
		const fft = getFFT(W);
		for (let x = 0; x < W; x++) {
			const v = fft[x];
			const idx = x * 4;
			state.buf.data[idx] = v >= 0.5 ? Math.round((v - 0.5) * 2 * 255) : 0;
			state.buf.data[idx + 1] =
				v >= 0.04
					? v < 0.5
						? Math.round(v * 2 * 255)
						: Math.round((1 - (v - 0.5) * 2) * 255)
					: 0;
			state.buf.data[idx + 2] = 0;
		}
		ctx.putImageData(state.buf, 0, 0);
	},
	preview(ctx, W, H, t, state) {
		if (!state.buf) state.buf = ctx.createImageData(W, H);
		const data = state.buf.data;
		data.copyWithin(W * 4, 0, W * (H - 1) * 4);
		for (let x = 0; x < W; x++) {
			const v =
				0.3 + 0.5 * Math.sin(t * 1.5 + x * 0.08) * Math.sin(t * 0.9 + x * 0.03);
			const i = x * 4;
			data[i] = v > 0.6 ? 200 : 0;
			data[i + 1] = Math.floor(v * 255);
			data[i + 2] = 0;
			data[i + 3] = 255;
		}
		ctx.putImageData(state.buf, 0, 0);
	},
});

registerViz({
	id: "radial",
	label: "RADIAL",
	draw(ctx, W, H) {
		ctx.fillStyle = "rgba(0,0,0,0.25)";
		ctx.fillRect(0, 0, W, H);
		const fft = getFFT(81);
		const cx = W / 2,
			cy = H / 2;
		const maxR = Math.min(W, H) * 0.44;
		const minR = maxR * 0.28;
		for (let i = 0; i < 80; i++) {
			const v = fft[i + 1];
			const a = (i / 80) * Math.PI * 2 - Math.PI / 2;
			const bLen = v * (maxR - minR);
			const hue = (i / 80) * 180 + 80;
			ctx.strokeStyle = `hsla(${hue},100%,60%,0.85)`;
			ctx.lineWidth = (W / 80) * 0.6;
			ctx.shadowColor = `hsl(${hue},100%,60%)`;
			ctx.shadowBlur = v * 10;
			ctx.beginPath();
			ctx.moveTo(cx + Math.cos(a) * minR, cy + Math.sin(a) * minR);
			ctx.lineTo(
				cx + Math.cos(a) * (minR + bLen),
				cy + Math.sin(a) * (minR + bLen),
			);
			ctx.stroke();
		}
		ctx.shadowBlur = 0;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2,
			cy = H / 2,
			N = 36;
		for (let i = 0; i < N; i++) {
			const angle = (i / N) * Math.PI * 2;
			const v =
				0.3 + 0.4 * Math.sin(t * 2 + i * 0.3) * Math.sin(t * 1.1 + i * 0.15);
			const len = v * Math.min(cx, cy) * 0.9;
			ctx.strokeStyle = `hsl(${(i / N) * 180 + 80},100%,55%)`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
			ctx.stroke();
		}
	},
});

registerViz({
	id: "starfield",
	label: "STARFIELD",
	draw(ctx, W, H, state) {
		ctx.fillStyle = "rgba(0,0,0,0.18)";
		ctx.fillRect(0, 0, W, H);
		if (!state.stars) {
			state.stars = Array.from({ length: 200 }, () => ({
				x: (Math.random() - 0.5) * 2,
				y: (Math.random() - 0.5) * 2,
				z: Math.random(),
			}));
		}
		const fft = getFFT(8);
		const speed = 0.012 + ((fft[2] + fft[3]) / 2) * 0.04;
		const cx = W / 2,
			cy = H / 2;
		for (const s of state.stars) {
			s.z -= speed;
			if (s.z <= 0) {
				s.x = (Math.random() - 0.5) * 2;
				s.y = (Math.random() - 0.5) * 2;
				s.z = 1;
			}
			const px = (s.x / s.z) * W * 0.5 + cx;
			const py = (s.y / s.z) * H * 0.5 + cy;
			if (px < 0 || px > W || py < 0 || py > H) {
				s.z = 0;
				continue;
			}
			const size = Math.max(0.4, (1 - s.z) * 3);
			ctx.fillStyle = `rgba(0,255,65,${(1 - s.z) * 0.9 + 0.1})`;
			ctx.shadowColor = "#00ff41";
			ctx.shadowBlur = size * 3;
			ctx.beginPath();
			ctx.arc(px, py, size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.shadowBlur = 0;
	},
	preview(ctx, W, H, _t, state) {
		if (!state.stars) {
			state.stars = Array.from({ length: 80 }, () => ({
				x: Math.random() * 2 - 1,
				y: Math.random() * 2 - 1,
				z: Math.random(),
			}));
		}
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2,
			cy = H / 2;
		for (const s of state.stars) {
			s.z -= 0.008;
			if (s.z <= 0) {
				s.x = Math.random() * 2 - 1;
				s.y = Math.random() * 2 - 1;
				s.z = 1;
			}
			const px = (s.x / s.z) * cx + cx;
			const py = (s.y / s.z) * cy + cy;
			if (px < 0 || px > W || py < 0 || py > H) {
				s.z = 0;
				continue;
			}
			const r = Math.max(0.5, (1 - s.z) * 2);
			ctx.fillStyle = `rgba(0,255,65,${1 - s.z})`;
			ctx.beginPath();
			ctx.arc(px, py, r, 0, Math.PI * 2);
			ctx.fill();
		}
	},
});

registerViz({
	id: "plasma",
	label: "PLASMA",
	draw(ctx, W, H, state) {
		const scale = 3;
		const pw = Math.ceil(W / scale),
			ph = Math.ceil(H / scale);
		if (!state.off || state.off.width !== pw || state.off.height !== ph) {
			state.off = new OffscreenCanvas(pw, ph);
			state.t = 0;
		}
		const fft = getFFT(12);
		const rawBass = (fft[2] + fft[3]) / 2;
		const rawMid = (fft[5] + fft[6]) / 2;
		const rawTreble = (fft[9] + fft[10]) / 2;

		// smooth with EMA to avoid per-frame jitter
		const a = 0.08;
		if (state.bass === undefined) {
			state.bass = rawBass;
			state.mid = rawMid;
			state.treble = rawTreble;
		}
		state.bass += a * (rawBass - state.bass);
		state.mid += a * (rawMid - state.mid);
		state.treble += a * (rawTreble - state.treble);

		// bass warps the ripple frequency; mid shifts hue; treble brightens
		const rippleFreq = 0.22 + state.bass * 0.4;
		const brightness = 180 + state.treble * 120;
		const hueShift = state.mid * 3;

		const octx = state.off.getContext("2d");
		const img = octx.createImageData(pw, ph);
		for (let y = 0; y < ph; y++) {
			for (let x = 0; x < pw; x++) {
				const v =
					Math.sin(x * 0.18 + state.t) +
					Math.sin(y * 0.15 + state.t * 0.7) +
					Math.sin((x + y) * 0.12 + state.t * 1.3) +
					Math.sin(
						Math.sqrt((x - pw / 2) ** 2 + (y - ph / 2) ** 2) * rippleFreq -
							state.t,
					);
				const h6 = (((v + 4) / 8) * 6 + hueShift) % 6;
				const f = h6 - Math.floor(h6),
					q = 1 - f;
				let r, g, b;
				switch (Math.floor(h6) % 6) {
					case 0:
						r = 1;
						g = f;
						b = 0;
						break;
					case 1:
						r = q;
						g = 1;
						b = 0;
						break;
					case 2:
						r = 0;
						g = 1;
						b = f;
						break;
					case 3:
						r = 0;
						g = q;
						b = 1;
						break;
					case 4:
						r = f;
						g = 0;
						b = 1;
						break;
					default:
						r = 1;
						g = 0;
						b = q;
				}
				const idx = (y * pw + x) * 4;
				img.data[idx] = r * brightness;
				img.data[idx + 1] = g * brightness;
				img.data[idx + 2] = b * brightness;
				img.data[idx + 3] = 255;
			}
		}
		octx.putImageData(img, 0, 0);
		ctx.imageSmoothingEnabled = true;
		ctx.drawImage(state.off, 0, 0, pw, ph, 0, 0, W, H);
		state.t += 0.03 + state.bass * 0.12;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const scale = 4;
		const sw = Math.ceil(W / scale),
			sh = Math.ceil(H / scale);
		for (let y = 0; y < sh; y++) {
			for (let x = 0; x < sw; x++) {
				const v =
					Math.sin(x * 0.3 + t * 2) +
					Math.sin(y * 0.3 + t * 1.5) +
					Math.sin((x + y) * 0.2 + t) +
					Math.sin(Math.sqrt(x * x + y * y) * 0.3 - t);
				const hue = (v + 4) * 45;
				const h6 = (hue / 60) % 6;
				const f = h6 - Math.floor(h6);
				const r = [1, 1 - f, 0, 0, f, 1][Math.floor(h6)];
				const g = [f, 1, 1, 1 - f, 0, 0][Math.floor(h6)];
				const b = [0, 0, f, 1, 1, 1 - f][Math.floor(h6)];
				ctx.fillStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
				ctx.fillRect(x * scale, y * scale, scale, scale);
			}
		}
	},
});

registerViz({
	id: "lissajous",
	label: "LISSAJOUS",
	draw(ctx, W, H) {
		ctx.fillStyle = "rgba(0,0,0,0.12)";
		ctx.fillRect(0, 0, W, H);
		const wave = getWave();
		const offset = Math.floor(wave.length / 4);
		const cx = W / 2,
			cy = H / 2;
		const rx = W * 0.44,
			ry = H * 0.44;

		let peak = 0.01;
		for (let i = 0; i < wave.length; i++)
			peak = Math.max(peak, Math.abs(wave[i]));
		const scale = Math.min(1.5, 0.85 / peak);

		ctx.beginPath();
		ctx.strokeStyle = "rgba(0,255,65,0.12)";
		ctx.lineWidth = 5;
		for (let i = 0; i < wave.length - offset; i++) {
			const x = cx + wave[i] * scale * rx;
			const y = cy + wave[i + offset] * scale * ry;
			i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();

		ctx.beginPath();
		ctx.strokeStyle = "#00ff41";
		ctx.lineWidth = 1.2;
		ctx.shadowColor = "#00ff41";
		ctx.shadowBlur = 8;
		for (let i = 0; i < wave.length - offset; i++) {
			const x = cx + wave[i] * scale * rx;
			const y = cy + wave[i + offset] * scale * ry;
			i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.shadowBlur = 0;
	},
	preview(ctx, W, H, t) {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, W, H);
		const cx = W / 2,
			cy = H / 2;
		const delta = t * 0.5;
		ctx.strokeStyle = "rgba(0,255,65,0.4)";
		ctx.lineWidth = 2;
		ctx.shadowColor = "#00ff41";
		ctx.shadowBlur = 4;
		ctx.beginPath();
		for (let i = 0; i <= 360; i++) {
			const a = (i / 360) * Math.PI * 2;
			const x = cx + Math.sin(3 * a + delta) * cx * 0.8;
			const y = cy + Math.sin(2 * a) * cy * 0.8;
			i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.shadowBlur = 0;
	},
});

registerViz({
	id: "particles",
	label: "PARTICLES",
	draw(ctx, W, H, state) {
		ctx.fillStyle = "rgba(0,0,0,0.15)";
		ctx.fillRect(0, 0, W, H);
		if (!state.particles) state.particles = [];
		const fft = getFFT(8);
		const bass = (fft[2] + fft[3]) / 2;
		if (bass > 0.2) {
			const count = Math.floor(bass * 25);
			for (let i = 0; i < count; i++) {
				const a = Math.random() * Math.PI * 2;
				const spd = 1.5 + Math.random() * 5 * bass;
				state.particles.push({
					x: W / 2,
					y: H / 2,
					vx: Math.cos(a) * spd,
					vy: Math.sin(a) * spd,
					life: 1,
					hue: 80 + Math.random() * 200,
				});
			}
		}
		state.particles = state.particles.filter((p) => p.life > 0);
		for (const p of state.particles) {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.06;
			p.life -= 0.015;
			ctx.fillStyle = `hsla(${p.hue},100%,65%,${p.life})`;
			ctx.shadowColor = `hsl(${p.hue},100%,65%)`;
			ctx.shadowBlur = 6;
			ctx.beginPath();
			ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.shadowBlur = 0;
	},
	preview(ctx, W, H, t, state) {
		if (!state.particles) state.particles = [];
		ctx.fillStyle = "rgba(0,0,0,0.25)";
		ctx.fillRect(0, 0, W, H);
		if (!state.lastBurst || t - state.lastBurst > 0.9) {
			state.lastBurst = t;
			for (let i = 0; i < 20; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = 1 + Math.random() * 2;
				state.particles.push({
					x: W / 2,
					y: H / 2,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					life: 1,
					hue: Math.random() * 60 + 100,
				});
			}
		}
		for (let i = state.particles.length - 1; i >= 0; i--) {
			const p = state.particles[i];
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.04;
			p.life -= 0.02;
			if (p.life <= 0) {
				state.particles.splice(i, 1);
				continue;
			}
			ctx.fillStyle = `hsla(${p.hue},100%,60%,${p.life})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
			ctx.fill();
		}
	},
});
