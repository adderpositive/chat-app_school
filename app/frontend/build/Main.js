"use strict";

var Main = React.createClass({
	getInitialState: function getInitialState() {
		return {
			id: "",
			login: "",
			name: "",
			surname: "",
			gender: "",
			email: "",
			nameHelper: "",

			chatRoomName: "",

			chatList: [],

			updateMessage: "",

			kicked: null,
			kickedRoom: ""
		};
	},

	componentWillMount: function componentWillMount() {
		$.ajax({
			dataType: "json",
			url: "main",
			method: "POST",
			success: function (data) {
				var user = data.user;
				if (data.inRoom && data.inRoom.kicked === null) {
					window.location.href = "chatroom/" + data.inRoom.id_rooms;
				} else {
					this.setState({
						id: user.id,
						login: user.login,
						name: user.name,
						nameHelper: user.name,
						surname: user.surname,
						gender: user.gender,
						email: user.email,
						kicked: data.inRoom.kicked,
						kickedRoom: data.inRoom.id_rooms
					});
				}
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});

		this.getChatRooms();
	},

	componentDidMount: function componentDidMount() {
		var _this = this;

		this.roomsInterval = setInterval(function () {
			_this.getChatRooms();

			_this.state.chatList.map(function (room) {
				var deleteDate = new Date(room.last_used),
				    now = new Date();

				deleteDate.setTime(deleteDate.getTime() + 12 * 60 * 60 * 1000);
				if (room.id_users_owner == null && deleteDate < now) {
					_this.deleteRoom(room.id);
				}
			});
		}, _this.props.delay);
	},

	componentWillUnmount: function componentWillUnmount() {
		clearInterval(this.roomsInterval);
		this.serverRequest.abort();
	},

	getChatRooms: function getChatRooms() {

		$.ajax({
			dataType: "json",
			url: "getchatrooms",
			method: "POST",
			success: function (data) {
				console.log(data);
				this.setState({
					chatList: data.rooms
				});
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	createChatRoom: function createChatRoom(event) {
		event.preventDefault();

		$.ajax({
			dataType: "json",
			url: "createroom",
			method: "POST",
			data: {
				title: this.state.chatRoomName
			},
			success: function (data) {
				window.location.href = "chatroom/" + data.roomId;
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	deleteRoom: function deleteRoom(roomId) {
		$.ajax({
			dataType: "json",
			url: "deleteroom",
			method: "POST",
			data: {
				id: roomId
			}
		});
	},

	updateProfile: function updateProfile(event) {
		event.preventDefault();

		var _this = this,
		    oldPsw = ReactDOM.findDOMNode(_this.refs.oldPassword).value,
		    newPsw1 = ReactDOM.findDOMNode(_this.refs.newPassword1).value,
		    newPsw2 = ReactDOM.findDOMNode(_this.refs.newPassword2).value,
		    isRightPsw = false,
		    message = "",
		    name = _this.state.name,
		    surname = _this.state.surname,
		    email = _this.state.email,
		    gender = _this.state.gender;

		if (!(oldPsw.length > 0 && newPsw1.length > 0 && newPsw2.length > 0)) {
			$.ajax({
				dataType: "json",
				url: 'editbasic',
				method: "POST",
				data: {
					name: name,
					surname: surname,
					email: email,
					gender: gender
				},
				success: function (data) {
					message = "Profile update was successful! If you want to change your passwords you have fill all inputs.";
					_this.setState({
						updateMessage: message,
						nameHelper: name
					});
				}.bind(this),
				error: function (xhr, status, err) {
					console.warn(xhr.responseText, status, err);
				}.bind(this)
			});
		} else {
			$.when($.ajax({
				dataType: "text",
				url: "psw",
				method: "POST",
				data: {
					"password": oldPsw
				},
				success: function (data) {
					isRightPsw = data == 'true';
				}.bind(this),
				error: function (xhr, status, err) {
					console.warn(xhr.responseText, status, err);
				}.bind(this)
			})).then(function () {
				if (isRightPsw) {
					if (newPsw1 === newPsw2) {
						$.ajax({
							dataType: "json",
							url: 'editall',
							method: "POST",
							data: {
								name: name,
								surname: surname,
								email: email,
								gender: gender,
								newPassword: newPsw1
							},
							success: function (data) {
								message = "Profile update was fully successful!";
								_this.setState({
									updateMessage: message,
									nameHelper: name
								});
							}.bind(this),
							error: function (xhr, status, err) {
								console.warn(xhr.responseText, status, err);
							}.bind(this)
						});
					} else {
						message = "New passwords are not same! Be careful!";
					}
				} else {
					message = "Actual passwords are not same! Are you hacker?";
				}

				_this.setState({
					updateMessage: message
				});
			});
		}

		_this.setState({
			updateMessage: message
		});
	},

	handleGender: function handleGender(event) {
		this.setState({
			gender: event.target.value
		});
	},

	setName: function setName(event) {
		this.setState({
			name: event.target.value
		});
	},

	setSurname: function setSurname(event) {
		this.setState({
			surname: event.target.value
		});
	},

	setEmail: function setEmail(event) {
		this.setState({
			email: event.target.value
		});
	},

	setChatRoomName: function setChatRoomName(event) {
		this.setState({
			chatRoomName: event.target.value
		});
	},

	render: function render() {
		var chatList,
		    _this = this;

		if (this.state.chatList.length > 0) {
			chatList = _this.state.chatList.map(function (room) {
				if (room.lock_room === "f") {

					_this.state.kickedRoom == room.id;

					if (_this.state.kicked) {
						var kickedDate = new Date(_this.state.kicked),
						    date = new Date();

						kickedDate.setSeconds(kickedDate.getSeconds() + _this.props.kicktime);

						if (kickedDate < date) {
							return React.createElement(
								"li",
								{ className: "main-list__item" },
								React.createElement(
									"a",
									{ className: "main-list__item-link", href: "chatroom/" + room.id },
									room.title
								)
							);
						} else {
							return React.createElement(
								"li",
								{ className: "main-list__item" },
								React.createElement(
									"div",
									{ className: "main-list__item-link locked" },
									room.title,
									" (kicked)"
								)
							);
						}
					} else {
						return React.createElement(
							"li",
							{ className: "main-list__item" },
							React.createElement(
								"a",
								{ className: "main-list__item-link", href: "chatroom/" + room.id },
								room.title
							)
						);
					}
				} else {
					return React.createElement(
						"li",
						{ className: "main-list__item" },
						React.createElement(
							"div",
							{ className: "main-list__item-link locked" },
							room.title,
							" (locked)"
						)
					);
				}
			});
		} else {
			chatList = React.createElement(
				"div",
				{ className: "row error" },
				"No rooms were found."
			);
		}

		return React.createElement(
			"div",
			{ className: "container main" },
			React.createElement(
				"div",
				{ className: "row" },
				React.createElement(
					"div",
					{ className: "five columns" },
					React.createElement(
						"h1",
						{ className: "main__heading" },
						"Hello ",
						this.state.nameHelper,
						"!"
					),
					React.createElement(
						"a",
						{ className: "button button-primary main__button jsPopupOpener", href: "#", "data-popup": "createRoom" },
						"Create chat room"
					),
					React.createElement(
						"a",
						{ className: "button main__button jsPopupOpener", href: "#", "data-popup": "settings" },
						"Settings"
					),
					React.createElement(
						"a",
						{ className: "button main__button jsPopupOpener", href: "#", "data-popup": "logout" },
						"Logout"
					)
				),
				React.createElement(
					"div",
					{ className: "seven columns" },
					React.createElement(
						"h2",
						{ className: "main__subheading" },
						"List of rooms"
					),
					React.createElement(
						"ul",
						{ className: "main-list" },
						chatList
					)
				)
			),
			React.createElement(
				"form",
				{ className: "popup createRoom mfp-hide", onSubmit: this.createChatRoom },
				React.createElement(
					"div",
					{ className: "popup__text" },
					"Create new room"
				),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "room-name" },
					"Name of new room"
				),
				React.createElement("input", { id: "room-name", className: "input popup__input", type: "text", value: this.state.chatRoomName, onChange: this.setChatRoomName }),
				React.createElement(
					"div",
					{ className: "popup__button-wrap" },
					React.createElement("input", { className: "button button-primary popup__button", type: "submit", value: "Create" })
				)
			),
			React.createElement(
				"form",
				{ className: "popup settings mfp-hide", onSubmit: this.updateProfile },
				React.createElement(
					"div",
					{ className: "popup__text" },
					"Profile settings"
				),
				React.createElement(
					"div",
					{ className: "row error" },
					this.state.updateMessage
				),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-login" },
					"Login"
				),
				React.createElement("input", { id: "user-login", className: "input popup__input", type: "text", value: this.state.login, disabled: true }),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-name" },
					"Name"
				),
				React.createElement("input", { id: "user-name", className: "input popup__input", type: "text", value: this.state.name, onChange: this.setName }),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-surname" },
					"Surname"
				),
				React.createElement("input", { id: "user-surname", className: "input popup__input", type: "text", value: this.state.surname, onChange: this.setSurname }),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-email" },
					"E-mail"
				),
				React.createElement("input", { id: "user-email", className: "input popup__input", type: "email", value: this.state.email, onChange: this.setEmail }),
				React.createElement(
					"div",
					{ className: "row print-languages" },
					React.createElement(
						"label",
						{ className: "popup__label", htmlFor: "user-surname" },
						"Gender"
					),
					React.createElement(
						"div",
						{ className: "three columns" },
						React.createElement(
							"label",
							null,
							React.createElement("input", { type: "radio", name: "gender", checked: this.state.gender === "m", value: "m", onChange: this.handleGender }),
							React.createElement(
								"span",
								{ className: "label-body" },
								"Male"
							)
						)
					),
					React.createElement(
						"div",
						{ className: "three columns" },
						React.createElement(
							"label",
							null,
							React.createElement("input", { type: "radio", name: "gender", checked: this.state.gender === "f", value: "f", onChange: this.handleGender }),
							React.createElement(
								"span",
								{ className: "label-body" },
								"Female"
							)
						)
					)
				),
				React.createElement(
					"label",
					{ className: "popup__label popup__label--password", htmlFor: "user-old-password" },
					"Old password:"
				),
				React.createElement("input", { id: "user-old-password", className: "input popup__input", type: "password", ref: "oldPassword" }),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-new-password" },
					"New password"
				),
				React.createElement("input", { id: "user-new-password", className: "input popup__input", type: "password", ref: "newPassword1" }),
				React.createElement(
					"label",
					{ className: "popup__label", htmlFor: "user-new-password2" },
					"Repeat new password"
				),
				React.createElement("input", { id: "user-new-password2", className: "input popup__input", type: "password", ref: "newPassword2" }),
				React.createElement(
					"div",
					{ className: "popup__button-wrap" },
					React.createElement("input", { className: "button button-primary popup__button", type: "submit", value: "Update profile settings" })
				)
			),
			React.createElement(
				"div",
				{ className: "popup logout mfp-hide" },
				React.createElement(
					"div",
					{ className: "popup__text" },
					"Do you really want to logout?"
				),
				React.createElement(
					"div",
					{ className: "popup__button-wrap" },
					React.createElement(
						"a",
						{ className: "button button-primary popup__button", href: "logout" },
						"YES"
					),
					React.createElement(
						"a",
						{ className: "button popup__button close", href: "#" },
						"NO"
					)
				)
			)
		);
	}

});

ReactDOM.render(React.createElement(Main, { delay: 5000, kicktime: 15 }), document.getElementById('main'));
