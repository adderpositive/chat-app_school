"use strict";

var ChatRoom = React.createClass({
	getInitialState: function getInitialState() {
		return {
			id: window.location.href.split("/").pop(),
			title: "",
			idUserOwner: "",
			idActiveUser: "",
			login: "",
			people: [],
			lockRoom: "",
			messages: [],
			privateMessages: [],
			lastMessageTime: null,
			entryTime: null
		};
	},

	componentWillMount: function componentWillMount() {
		var _this = this;

		$.ajax({
			dataType: "json",
			method: "POST",
			success: function (data) {
				var userId = data.roomInfo.userId,
				    people = data.people;

				this.setState({
					id: data.roomInfo.id,
					idUserOwner: data.roomInfo.id_users_owner,
					idActiveUser: userId,
					login: data.roomInfo.login,
					lockRoom: data.roomInfo.lock_room,
					title: data.roomInfo.title,
					people: _this.peopleNotKicked(people, userId),
					messages: data.messages,
					lastMessageTime: _this.getLastMessageTima(people, userId),
					entryTime: _this.getEntryTime(people, userId)
				});
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
				window.location.href = "../main";
			}.bind(this)
		});
	},

	componentDidMount: function componentDidMount() {
		var _this = this;

		this.peopleInterval = setInterval(function () {
			$.ajax({
				dataType: "json",
				url: "../people",
				method: "POST",
				data: {
					id: _this.state.id
				},
				success: function (data) {
					var idActiveUser = _this.state.idActiveUser,
					    people = data.people;

					_this.setState({
						people: _this.peopleNotKicked(people, idActiveUser),
						idUserOwner: data.roomInfo.id_users_owner,
						lastMessageTime: _this.getLastMessageTima(people, idActiveUser),
						entryTime: _this.getEntryTime(people, idActiveUser)
					});
				}.bind(this),
				error: function (xhr, status, err) {
					console.warn(xhr.responseText, status, err);
				}.bind(this)
			});
		}, this.props.delay);

		this.messagesInterval = setInterval(function () {
			$.ajax({
				dataType: "json",
				url: "../messages",
				method: "POST",
				data: {
					id: _this.state.id
				},
				success: function (data) {
					if (data.messages.length > 0 && JSON.stringify(data.messages) != JSON.stringify(_this.state.messages)) {
						_this.setState({
							messages: data.messages
						});
					}
				}.bind(this),
				error: function (xhr, status, err) {
					console.warn(xhr.responseText, status, err);
				}.bind(this)
			});
		}, this.props.delay);

		this.privateMessagesInterval = setInterval(function () {

			$.ajax({
				dataType: "json",
				url: "../getprivate",
				method: "POST",
				success: function (data) {
					if (data.messages.length > 0 && JSON.stringify(data.messages) != JSON.stringify(_this.state.privateMessages)) {
						_this.setState({
							privateMessages: data.messages
						});
					}
				}.bind(this),
				error: function (xhr, status, err) {
					console.warn(xhr.responseText, status, err);
				}.bind(this)
			});
		}, this.props.delay);

		this.inactiveInterval = setInterval(function () {

			var s = _this.state,
			    idUserOwner = s.idUserOwner,
			    idActiveUser = s.idActiveUser;

			if (idUserOwner != idActiveUser) {

				var inactiveDate,
				    date = new Date();
				if (s.lastMessageTime != null) {
					var mesTime = new Date(s.lastMessageTime),
					    entryTime = new Date(s.entryTime);

					if (mesTime > entryTime) {
						inactiveDate = mesTime;
					} else {
						inactiveDate = entryTime;
					}
				} else {
					inactiveDate = new Date(s.entryTime);
				}

				inactiveDate.setSeconds(inactiveDate.getSeconds() + _this.props.inactivetime);
				if (inactiveDate < date) {
					_this.handleLeaveRoom(true);
				}
			}
		}, 500);
	},

	componentWillUnmount: function componentWillUnmount() {
		clearInterval(this.peopleInterval);
		clearInterval(this.messagesInterval);
		clearInterval(this.privateMessagesInterval);
		clearInterval(this.inactiveInterval);

		this.serverRequest.abort();
	},

	handleLeaveRoom: function handleLeaveRoom(redirect) {
		var idUserOwner = this.state.idUserOwner,
		    idActiveUser = this.state.idActiveUser,
		    lastUsed = false;

		if (idUserOwner == idActiveUser) {

			if (this.state.people.length != 1) {
				var people = this.state.people.filter(function (person) {
					return person.id !== idActiveUser;
				});

				var randomPerson = people[Math.floor(Math.random() * people.length)];

				$.ajax({
					dataType: "json",
					url: "../setnewroomowner",
					method: "POST",
					data: {
						id: this.state.id,
						newUserOwner: randomPerson.id
					},
					success: function (data) {
						this.setState({
							idUserOwner: data.id
						});
					}.bind(this),
					error: function (xhr, status, err) {
						console.warn(xhr.responseText, status, err);
					}.bind(this)
				});
			} else {
				lastUsed = true;
			}
		}

		$.ajax({
			dataType: "json",
			url: "../leaveroom",
			method: "POST",
			data: {
				id: this.state.id,
				lastUsed: lastUsed
			},
			success: function (data) {
				if (redirect) {
					window.location.href = "../main";
				}
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	leaveRoom: function leaveRoom(event) {
		event.preventDefault();
		this.handleLeaveRoom(true);
	},

	deleteRoom: function deleteRoom() {
		$.ajax({
			dataType: "json",
			url: "../deleteroom",
			method: "POST",
			data: {
				id: this.state.id
			},
			success: function (data) {
				window.location.href = "../main";
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	lockRoom: function lockRoom(event) {
		event.preventDefault();

		$.ajax({
			dataType: "json",
			url: "../lockroom",
			method: "POST",
			data: {
				id: this.state.id
			},
			success: function (data) {
				this.setState({
					lockRoom: 't'
				});
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	unlockRoom: function unlockRoom(event) {
		event.preventDefault();

		$.ajax({
			dataType: "json",
			url: "../unlockroom",
			method: "POST",
			data: {
				id: this.state.id
			},
			success: function (data) {
				this.setState({
					lockRoom: 'f'
				});
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	sendMessage: function sendMessage(message) {

		$.ajax({
			dataType: "json",
			url: "../sendmessage",
			method: "POST",
			data: {
				idRoom: parseInt(this.state.id),
				idUserFrom: parseInt(this.state.idActiveUser),
				idUserTo: null,
				message: message
			},
			success: function (data) {
				var messages = this.state.messages;

				var newMessage = {
					id: parseInt(this.state.idActiveUser),
					login: this.state.login,
					message: message,
					time: data.time
				};

				messages.unshift(newMessage);

				this.setState({
					messages: messages
				});
			}.bind(this),
			error: function (xhr, status, err) {
				console.warn(xhr.responseText, status, err);
			}.bind(this)
		});
	},

	sendPrivateMessage: function sendPrivateMessage(event) {
		event.preventDefault();

		var userId = event.target.dataset.userid,
		    message = ReactDOM.findDOMNode(this.refs["private-" + userId]).value;

		$.ajax({
			dataType: "json",
			url: "../sendmessage",
			method: "POST",
			data: {
				idRoom: parseInt(this.state.id),
				idUserFrom: parseInt(this.state.idActiveUser),
				idUserTo: parseInt(userId),
				message: message
			}
		});
	},

	kickPerson: function kickPerson(event) {
		event.preventDefault();

		var idKickedPerson = event.target.dataset.userid;

		$.ajax({
			dataType: "json",
			url: "../kickperson",
			method: "POST",
			data: {
				idKickedPerson: idKickedPerson
			}
		});
	},

	sortFunction: function sortFunction(mes1, mes2) {
		var dateA = new Date(mes1.time);
		var dateB = new Date(mes2.time);
		return dateA < dateB ? 1 : -1;
	},

	peopleNotKicked: function peopleNotKicked(people, uderId) {
		var _this = this;

		return people.filter(function (person) {
			if (person.kicked === null) {
				return person;
			} else {
				var kickedDate = new Date(person.kicked),
				    date = new Date();

				kickedDate.setSeconds(kickedDate.getSeconds() + _this.props.kicktime);
				if (kickedDate < date) {
					$.ajax({
						dataType: "json",
						url: "../leaveroom",
						method: "POST",
						data: {
							id: _this.state.id,
							idKickedUser: person.id
						}
					});
				} else {
					if (uderId == person.id) {
						window.location.href = "../main";
					}
				}
			}
		});
	},

	getLastMessageTima: function getLastMessageTima(people, userId) {

		var data = people.filter(function (person) {
			if (person.id == userId) {
				return person;
			}
		});

		return data[0].last_message;
	},

	getEntryTime: function getEntryTime(people, userId) {

		var data = people.filter(function (person) {
			if (person.id == userId) {
				return person;
			}
		});

		return data[0].entered;
	},

	render: function render() {
		var _this = this,
		    people = _this.state.people,
		    messages = _this.state.messages,
		    idOwner = _this.state.idUserOwner,
		    idActiveUser = _this.state.idActiveUser,
		    lockRoom = _this.state.lockRoom,
		    privateMessages = _this.state.privateMessages;

		var listPeople = people.map(function (person) {
			if (idOwner == person.id) {
				if (idActiveUser == idOwner) {
					return React.createElement(
						"div",
						{ className: "person", key: person.id },
						React.createElement(
							"div",
							{ className: "person person__login--admin" },
							person.login,
							" (admin)"
						)
					);
				} else {
					return React.createElement(
						"div",
						{ className: "person", key: person.id },
						React.createElement(
							"div",
							{ className: "person person__login--admin" },
							person.login,
							" (admin)"
						),
						React.createElement(
							"div",
							{ className: "person-wrap" },
							React.createElement(
								"form",
								{ className: "person-form", onSubmit: _this.sendPrivateMessage, "data-userid": person.id },
								React.createElement("textarea", { className: "person-form__area", ref: "private-" + person.id, placeholder: "Write to " + person.login }),
								React.createElement("input", { className: "person__button person__button--form green", type: "submit", value: "Send private message" })
							)
						)
					);
				}
			} else if (idOwner != person.id && idActiveUser == person.id) {
				return React.createElement(
					"div",
					{ className: "person", key: person.id },
					React.createElement(
						"div",
						{ className: "person__login person__login--active" },
						person.login
					)
				);
			} else {
				if (idActiveUser == idOwner) {
					return React.createElement(
						"div",
						{ className: "person", key: person.id },
						React.createElement(
							"div",
							{ className: "person__login" },
							person.login
						),
						React.createElement(
							"div",
							{ className: "person-wrap" },
							React.createElement(
								"a",
								{ className: "person__button red", href: "#", onClick: _this.kickPerson, "data-userid": person.id, title: "Kick user" },
								"Kick user ",
								person.login
							),
							React.createElement(
								"form",
								{ className: "person-form", onSubmit: _this.sendPrivateMessage, "data-userid": person.id },
								React.createElement("textarea", { className: "person-form__area", ref: "private-" + person.id, placeholder: "Write to " + person.login }),
								React.createElement("input", { className: "person__button person__button--form green", type: "submit", value: "Send private message" })
							)
						)
					);
				} else {
					return React.createElement(
						"div",
						{ className: "person", key: person.id },
						React.createElement(
							"div",
							{ className: "person__login" },
							person.login
						),
						React.createElement(
							"div",
							{ className: "person-wrap" },
							React.createElement(
								"form",
								{ className: "person-form", onSubmit: _this.sendPrivateMessage, "data-userid": person.id },
								React.createElement("textarea", { className: "person-form__area", ref: "private-" + person.id, placeholder: "Write to " + person.login }),
								React.createElement("input", { className: "person__button person__button--form green", type: "submit", value: "Send private message" })
							)
						)
					);
				}
			}
		});

		var lockButton;
		if (idOwner == idActiveUser && people.length != 1) {
			if (lockRoom == 'f') {
				lockButton = React.createElement(
					"a",
					{ className: "chatroom-buttons__item red", href: "#", onClick: this.lockRoom, title: "Lock the chat room" },
					"Lock the room"
				);
			} else {
				lockButton = React.createElement(
					"a",
					{ className: "chatroom-buttons__item green", href: "#", onClick: this.unlockRoom, title: "Unlock the chat room" },
					"Unlock the room"
				);
			}
		}

		var deleteButton = people.length == 1 ? React.createElement(
			"a",
			{ className: "chatroom-buttons__item purple", href: "#", onClick: this.deleteRoom, title: "Delete room" },
			"Delete room"
		) : "";

		var newMessages = messages.concat(privateMessages),
		    sortedMessages = newMessages.sort(_this.sortFunction),
		    listMessages = sortedMessages.map(function (message) {

			return React.createElement(
				"div",
				{ className: message.id_users_to ? "message message--private" : "message", key: message.id_messages },
				React.createElement(
					"div",
					{ className: "message-info" },
					React.createElement(
						"div",
						{ className: "message__name" },
						message.login
					),
					React.createElement(
						"div",
						{ className: "message__date" },
						message.time,
						" ",
						message.id_users_to ? "- PRIVATE MESSAGE" : ""
					)
				),
				React.createElement(
					"div",
					{ className: "message__message" },
					message.message
				)
			);
		});

		var textareaBehaviour = function textareaBehaviour(e) {
			var message = ReactDOM.findDOMNode(_this.refs.message).value;

			if (message.length > 0 && e.key === "Enter") {
				e.preventDefault();

				_this.sendMessage(message);

				ReactDOM.findDOMNode(_this.refs.message).value = "";
			}
		};

		return React.createElement(
			"div",
			{ className: "chatroom" },
			React.createElement(
				"div",
				{ className: "chatroom-people" },
				React.createElement(
					"h1",
					{ className: "chatroom__heading" },
					"People in ",
					this.state.title
				),
				React.createElement(
					"div",
					{ className: "chatroom-people__wrap" },
					listPeople
				),
				React.createElement(
					"div",
					{ className: "chatroom-buttons" },
					lockButton,
					deleteButton,
					React.createElement(
						"a",
						{ className: "chatroom-buttons__item yellow", href: "#", onClick: this.leaveRoom, title: "Leave the chat room" },
						"Leave the room"
					)
				)
			),
			React.createElement(
				"div",
				{ className: "chatroom-wrap" },
				React.createElement(
					"div",
					{ className: "chatroom-content" },
					listMessages
				),
				React.createElement(
					"form",
					{ className: "chatroom-message" },
					React.createElement("textarea", { className: "chatroom-message__input", ref: "message", placeholder: "Write a message", onKeyPress: textareaBehaviour })
				)
			)
		);
	}
});

ReactDOM.render(React.createElement(ChatRoom, { delay: 3000, kicktime: 15, inactivetime: 30 }), document.getElementById('chatroom'));
