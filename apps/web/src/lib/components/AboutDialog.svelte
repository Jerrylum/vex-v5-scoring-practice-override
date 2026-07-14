<script lang="ts">
	import Dialog from '$lib/components/dialog/Dialog.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const titleId = 'about-dialog-title';
</script>

<Dialog {open} {onClose} ariaLabelledBy={titleId} contentClass="max-w-2xl!">
	<div class="space-y-4">
		<h2 id={titleId} class="text-lg font-bold text-white">About</h2>

		<div class="space-y-4 text-sm leading-relaxed text-[#CDD7E1]">
			<section>
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">Getting Started</h3>
				<p>
					Select a difficulty level and click <strong>New</strong> to generate a random field scenario. Examine the 3D field: count visible pin
					halves on each goal, note each quadrant's toggle color, and count robots in midfield. Enter those counts in the scoring panel tabs.
				</p>
			</section>

			<section>
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">Scoring</h3>
				<ul class="ml-4 list-disc space-y-1">
					<li><strong>Alliance-colored pin half</strong> (red or blue): 5 pts</li>
					<li><strong>Yellow pin half</strong> (when owned): 10 pts</li>
					<li><strong>Robot in midfield:</strong> 8 pts</li>
				</ul>
				<p class="mt-2 text-gray-400">
					Yellow ownership: a quadrant uses its toggle color; midfield uses the alliance with more robots (tied = yellow doesn't score).
					Alliance-colored halves always score for their alliance.
				</p>
			</section>

			<section>
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">Controls</h3>
				<ul class="ml-4 list-disc space-y-1">
					<li><strong>Left click + drag:</strong> Rotate camera</li>
					<li><strong>Right click + drag:</strong> Pan camera</li>
					<li><strong>Scroll:</strong> Zoom in/out</li>
					<li><strong>Touch:</strong> Pinch to zoom, drag to rotate</li>
				</ul>
				<p class="mt-2 text-gray-400">Esc opens the menu · [ toggles controls</p>
			</section>

			<section>
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">Checking Your Score</h3>
				<p>
					After entering your counts, click <strong>Check</strong> to verify. Correct counts for each region are shown so you can see what you
					might have missed.
				</p>
			</section>

			<section>
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">Multiplayer</h3>
				<p>
					Create a room from <strong>Multiplayer</strong> on the main menu, then share the link or QR code. Scoring and scenarios stay in sync
					across clients.
				</p>
			</section>

			<section class="border-t border-gray-800 pt-4">
				<h3 class="mb-2 text-base font-semibold text-[#007fff]">About</h3>
				<p class="mb-2">
					This project is open source and available on GitHub:
					<a
						href="https://github.com/Jerrylum/vex-v5-scoring-practice-override"
						target="_blank"
						rel="noopener noreferrer"
						class="text-[#60a5fa] hover:underline"
					>
						Jerrylum/vex-v5-scoring-practice-override
					</a>
				</p>
				<p class="text-xs text-gray-500">
					This project is licensed under the GNU General Public License v3.0 (GPLv3). VEX and VEX V5 are trademarks of Innovation First
					International, Inc.
				</p>
			</section>
		</div>

		<div class="flex justify-end border-t border-gray-800 pt-4">
			<button
				type="button"
				class="cursor-pointer rounded-full bg-[#32383E] px-4 py-2 text-sm text-[#CDD7E1] hover:bg-[#3d444b]"
				onclick={onClose}
			>
				Close
			</button>
		</div>
	</div>
</Dialog>
