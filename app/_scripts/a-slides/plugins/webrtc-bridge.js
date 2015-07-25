'use strict';

require('./util-polyfills');
const EventEmitter = require('events').EventEmitter;
const Peer = require('peerjs');
const masterName = 'ada-slides-controller';

// Define peerJS Details

var myPeer;

function webRTCSetup({peerSettings, peerController = true, slideContainer}) {
	return new Promise((resolve, reject) => {

		myPeer = (peerController ? new Peer(masterName, location.hash === '#controller', peerSettings) : new Peer(peerSettings))
			.on('error', e => {
				if (e.type === "unavailable-id") {
					peerController = false;
					myPeer = new Peer(peerSettings)
						.on('error', e => {
							reject(e);
						})
						.on('open', resolve);
				} else {
					reject(e);
				}
			})
			.on('open', resolve);
	}).then(id => {

		class WebrtcUser {
			constructor(controller) {
				const ev = new EventEmitter();
				this.on = ev.on.bind(this);
				this.fire = ev.emit.bind(this);
				this.slideClients = [];
				this.controller = controller;
			}

			addClient(dataConn) {
				this.slideClients.push(dataConn);
			}

			sendData(dataConn, type, data) {
				dataConn.send({type, data});
			}

			sendSignalToClients(type, data) {
				this.slideClients.forEach(dc => this.sendData(dc, type, data));
			}

			// Tell all of the clients to move on one slide
			requestSlide(i) {
				console.log('Requseting slide', i);
				this.sendSignalToClients('goToSlide', i);
			}

			// Tell all of the clients to move on one event
			triggerRemoteEvent() {
				console.log('Triggering remote interaction event');
				this.sendSignalToClients('triggerEvent');
			}
		}
		let user = new WebrtcUser();

		if (peerController) {
			console.log('You have the power', id);
			slideContainer.classList.add('controller');
			myPeer.on('connection', dataConn => {
				console.log('recieved connection from', dataConn.peer);
				user.addClient(dataConn);
			});
		} else {
			console.log('You are the slides', id);
			var dc = myPeer.connect(masterName);
			dc.on('data', data => {
				console.log('recieved instructions', JSON.stringify(data));
				user.fire(data.type, data.data);
			});
		}
		return user;
	})
	.then(user => {

		slideContainer.on('a-slides_slide-setup', ({slideId}) =>  user.requestSlide.bind(user)(slideId));
		slideContainer.on('a-slides_trigger-event', () => user.triggerRemoteEvent.bind(user)());
		user.on('goToSlide', slide => slideContainer.fire('a-slides_goto-slide-by-dom', {slide: slideContainer.$(`#${slide}`)}));
		user.on('triggerEvent', () => slideContainer.fire('a-slides_trigger-event'));
	}, err => {
		console.error('Failure to connect to webrtc', err);
	});
}

module.exports = function (peerSettings, peerController) {
	return function ({slideContainer}) {
		return webRTCSetup({
			peerSettings,
			peerController,
			slideContainer
		});
	};
};