'use strict';

/**
 * Constants
 */

/**
 * Dependencies
 */

const ASlides = require('./a-slides');
const slideData = require('./content');
const slideContainer = document.querySelector('.slide-container');

new ASlides(slideData, {
	slideContainer,
	plugins: [
		require('./a-slides/plugins/markdown'), // needs to be run first
		require('./a-slides/plugins/slide-controller'), // needs to be run before buttons are added to it.
		require('./a-slides/plugins/deep-linking'),
		require('./a-slides/plugins/interaction-keyboard-mouse'),
		require('./a-slides/plugins/interaction-touch')({
			use: ['swipe-back']
		}),
		require('./a-slides/plugins/deep-linking'),
		require('./a-slides/plugins/sw-bridge'),
		require('./a-slides/plugins/webrtc-bridge')({
			peerSettings: {
				host: '1am.club',
				secure: true,
				port: 9000,
				debug: 2,
				path:"/peerjs"
			}
		})
	]
});

if (location.search === '?presentation') {
	slideContainer.classList.add('presentation');
}

if (location.search === '?notes') {
	slideContainer.classList.add('hide-presentation');
}
