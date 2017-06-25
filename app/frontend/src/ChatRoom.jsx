/*================================================

	Chatroom
	========
	- chat room handling all chat behaviour

	Proptypes
	---------

		@delay - delay for request (default 3000ms)
		@kicktime - time for kicked user (15s)
		@inactivetime - time for inactive person (30s)

	Initial State
	-------------

		@var id - chat room id
		@var title
		@var idUserOwner
		@var idActiveUser
		@var login - user adtive login name
		@var people - people in room
		@var lockRoom - lock room ('t', 'f')
		@var messages - messages
		@var privateMessages - private messages
		@var lastMessageTime - time of last sended message
		@var entryTime

	Lifecycle methods
	-----------------
		@function componentWillMount
		@function componentDidMount
		@function componentWillUnmount

	Core functions
	--------------
		@function handleLeaveRoom - POST ajax handles leaving room
		@function leaveRoom - leave room for button
		@function deleteRoom - POST ajax deleting room
		@function lockRoom - POST ajax locking room
		@function unlockRoom - POST ajax unlocking room
		@function kickPerson - POST ajax for kicking person from room
		@function sendMessage - POST ajax for sending message
		@function sendPrivateMessage POST ajax for sending private message
		@function sortFunction - sorting items according date 
		@function peopleNotKicked - returing not kicked array of people
		@function getLastMessageTima - get last message time in room
		@function getEntryTime - get last entry time in room

================================================ */

var ChatRoom = React.createClass({

	// initial state
	getInitialState: function() {
		return {
			id: window.location.href.split("/").pop(),
			title: "",
			idUserOwner: "",
			idActiveUser: "", // active user id
			login: "",
			people: [],
			lockRoom: "",
			messages: [],
			privateMessages: [],
			lastMessageTime: null,
			entryTime: null
		};
	},

	/** componentWillMount
	   	==================
		
		- get basi information about messages, people in room and
		inforamation about room
	*/
	componentWillMount: function(){
		// default info about room with data about people
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
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		        window.location.href = "../main";
		    }.bind(this)
		});
	},

	/** componentDidMount
	   	=================
		
		- set for intervals for requesting server
			1. peopleInterval - checking people in room
			2. messagesInterval - checking messages in room
			3. privateMessagesInterval - checking private people in room
			4. inactiveInterval - checking user inactive

	*/
	componentDidMount: function() {
		var _this = this;
		
		// active people
		this.peopleInterval = setInterval( function() {
			// updating people in room
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
				error: function(xhr, status, err) {
			        console.warn(xhr.responseText, status, err);
			    }.bind(this)
			});

		}, this.props.delay );

		// messages
		this.messagesInterval = setInterval( function() {
			// updating messages in room
			$.ajax({
				dataType: "json",
				url: "../messages",
				method: "POST",
				data: {
					id: _this.state.id
				},
				success: function (data) {
					// there is some message AND there IS some change in messages - update
					if(data.messages.length > 0 && JSON.stringify(data.messages) != JSON.stringify(_this.state.messages)) {
						_this.setState({
							messages: data.messages
						});
					}
				}.bind(this),
				error: function(xhr, status, err) {
			        console.warn(xhr.responseText, status, err);
			    }.bind(this)
			});
		}, this.props.delay );

		// private message
		this.privateMessagesInterval = setInterval( function() {

			$.ajax({
				dataType: "json",
				url: "../getprivate",
				method: "POST",
				success: function (data) {
					// there is some message AND there IS some change in private messages - update
					if(data.messages.length > 0 && JSON.stringify(data.messages) != JSON.stringify(_this.state.privateMessages)) {
						_this.setState({
							privateMessages: data.messages
						});	
					}	
				}.bind(this),
				error: function(xhr, status, err) {
			        console.warn(xhr.responseText, status, err);
			    }.bind(this)
			});
		}, this.props.delay );

		// inactive interval
		this.inactiveInterval = setInterval( function() {

			var s = _this.state,
				idUserOwner = s.idUserOwner,
				idActiveUser = s.idActiveUser;

			// if is not admin
			if(idUserOwner != idActiveUser) {
				
				var inactiveDate,
					date = new Date(); // actual date

				// if last message time IS NOT null
				if(s.lastMessageTime != null) {
					var mesTime = new Date(s.lastMessageTime),
						entryTime = new Date(s.entryTime);

					// if last message time is bigger than etry time
					if(mesTime > entryTime) {
						inactiveDate = mesTime; // take last message time
					} else {
						inactiveDate = entryTime; // take entry time
					}

				// if last message time IS null
				} else {
					inactiveDate = new Date(s.entryTime); // take entry time
				}	
					
				inactiveDate.setSeconds( inactiveDate.getSeconds() + _this.props.inactivetime ); // set inactive date + inactivetime (30s)
				
				// leave
				if(inactiveDate < date) {
					_this.handleLeaveRoom(true);
				}
			}
			
		}, 500 );

	},

	/** componentWillUnmount
	   	====================
		
		- kill requests & clear timers
	*/
	componentWillUnmount: function() {

		// clearing
		clearInterval(this.peopleInterval);
		clearInterval(this.messagesInterval);
		clearInterval(this.privateMessagesInterval);
		clearInterval(this.inactiveInterval);

		this.serverRequest.abort();
	},

	
	/** handleLeaveRoom
	   	===============
		
		- ajax request for leave room

	*/
	handleLeaveRoom: function(redirect) {

		// set new admin in room
		var idUserOwner = this.state.idUserOwner,
			idActiveUser = this.state.idActiveUser,
			lastUsed = false;

		// if IS admin && there are more people in room
		if(idUserOwner == idActiveUser) {

			if(this.state.people.length != 1) {
			
				// array of people without admin
				var people = this.state.people.filter(function(person) { 
				    return person.id !== idActiveUser;
				});

				// get random person
				var randomPerson = people[Math.floor(Math.random() * people.length)];

				// set new user owner
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
					error: function(xhr, status, err) {
				        console.warn(xhr.responseText, status, err);
				    }.bind(this)
				});

			// there is only adminoom
			} else {
				lastUsed = true;
			}
		}

		// leave room according state id
		$.ajax({
			dataType: "json",
			url: "../leaveroom",
			method: "POST",
			data: {
				id: this.state.id,
				lastUsed: lastUsed
			},
			success: function (data) {
				if(redirect) {
					window.location.href = "../main"; // redirect
				}
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** leaveRoom
	   	=========
		
		- button function leave room
		
	*/
	
	leaveRoom: function(event) {
		event.preventDefault();
		this.handleLeaveRoom(true);
	},

	/** deleteRoom
	   	==========
		
		- ajax req. for deleting room according state id
		- after succes - redirect on main
	*/
	deleteRoom: function() {
		$.ajax({
			dataType: "json",
			url: "../deleteroom",
			method: "POST",
			data: {
				id: this.state.id
			},
			success: function (data) {
				window.location.href = "../main"; // redirect
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** lockRoom
	   	========
		
		- ajax req. for locking room according state id
	*/
	lockRoom: function(event) {
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
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** unlockRoom
	   	==========
		
		- ajax req. for unlocking room according state id
	*/
	unlockRoom: function(event) {
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
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** sendMessage
	   	===========
		
		- ajax req. for sending message
		- gotten message unshifted (push to first position)

		@send idRoom, idUsers, idUsersTo = null, message
	*/
	sendMessage: function(message) {

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
				// array of messages
				var messages = this.state.messages;

				var newMessage = {
					id: parseInt(this.state.idActiveUser),
					login: this.state.login,
					message: message,
					time: data.time
				};

				// push on the first position in array
				messages.unshift(newMessage);

				// set state
				this.setState({
					messages: messages
				});
			}.bind(this),
			error: function(xhr, status, err) {
		        console.warn(xhr.responseText, status, err);
		    }.bind(this)
		});
	},

	/** sendPrivateMessage
	   	==================
		
		- ajax req. for sending private message
		
		@send idRoom, idUsers, idUsersTo, message
	*/

	sendPrivateMessage: function(event) {
		event.preventDefault();

		var userId = event.target.dataset.userid, // id user to
			message = ReactDOM.findDOMNode(this.refs["private-" + userId]).value; // get private message

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

	/** kickPerson
	   	==========
		
		- kicking person according div user.id

	*/
	kickPerson: function(event) {
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

	/** sortFunction
	   	============

		- sorting messages according date

	*/
	sortFunction: function(mes1, mes2){  
	    var dateA = new Date(mes1.time);
	    var dateB = new Date(mes2.time);
	    return dateA < dateB ? 1 : -1;  
	},

	/** peopleNotKicked
	   	===============
		
		- returning people not kicked from room

		@var people, userId
		@return people not kicked from room
	*/
	peopleNotKicked: function(people, uderId) {
		var _this = this;
		
		return people.filter(function(person) {
			// if kicked IS null
			if(person.kicked === null) {
				return person;

			// if kicked IS NOT null
			} else {
				var kickedDate = new Date(person.kicked), // kicked data
					date = new Date(); // actual date
					
				kickedDate.setSeconds( kickedDate.getSeconds() + _this.props.kicktime ); // set kicked date + kicktime (15s)

				// if person is not kicked anymore
				if(kickedDate < date) {

					// call leaveroom
					$.ajax({
						dataType: "json",
						url: "../leaveroom",
						method: "POST",
						data: {
							id: _this.state.id,
							idKickedUser: person.id
						}
					});
				// of person is still kicked
				} else {

					// if this is logged acount
					if(uderId == person.id) {
						window.location.href = "../main"; // redirect
					}
				}
			}
		});
	},

	/** getLastMessageTima
	   	==================
		
		- returning last message time 
		from people array according uderId

		@var people, userId
		@return last message time
	*/
	getLastMessageTima: function(people, userId) {
		
		var data = people.filter(function(person) {
			if(person.id == userId) {
				return person;
			}
		});

		return data[0].last_message;
	},

	/** getEntryTime
	   	============
		
		- returning entry time from 
		people array according uderId

		@var people, userId
		@return last message time

	*/
	getEntryTime: function(people, userId) {
		
		var data = people.filter(function(person) {
			if(person.id == userId) {
				return person;
			}
		});

		return data[0].entered;
	},

	// render
	render: function() {

		// save props to varables
		var _this = this,
			people = _this.state.people,
			messages = _this.state.messages,
			idOwner = _this.state.idUserOwner,
			idActiveUser = _this.state.idActiveUser,
			lockRoom = _this.state.lockRoom,
			privateMessages = _this.state.privateMessages;

		// get list of people
		var listPeople = people.map(function(person) {

			// if admin
			if(idOwner == person.id) {

				// if active user is admin
				if(idActiveUser == idOwner) {
					// current admin
					return (
						<div className="person" key={person.id}>
							<div className="person person__login--admin">{person.login} (admin)</div>
						</div>
					);
				} else {
					// can send private message
					return (
						<div className="person" key={person.id}>
							<div className="person person__login--admin">{person.login} (admin)</div>
							<div className="person-wrap">
								<form className="person-form" onSubmit={_this.sendPrivateMessage} data-userid={person.id}>
									<textarea className="person-form__area" ref={"private-" + person.id} placeholder={"Write to " + person.login}></textarea>
									<input className="person__button person__button--form green" type="submit" value="Send private message" />
								</form>
							</div>
						</div>
					);
				}

			// check if it is active user AND not admin
			} else if(idOwner != person.id && idActiveUser == person.id) {
				// current active
				return (
					<div className="person" key={person.id}>
						<div className="person__login person__login--active">{person.login}</div>
					</div>
				);
			
			// else 
			} else {

				// if active user is admin
				if(idActiveUser == idOwner) {
					// user in room can be kicked 
					return (
						<div className="person" key={person.id}>
							<div className="person__login">{person.login}</div>
							<div className="person-wrap">
								<a className="person__button red" href="#" onClick={_this.kickPerson} data-userid={person.id} title="Kick user">Kick user {person.login}</a>
								<form className="person-form" onSubmit={_this.sendPrivateMessage} data-userid={person.id}>
									<textarea className="person-form__area" ref={"private-" + person.id} placeholder={"Write to " + person.login}></textarea>
									<input className="person__button person__button--form green" type="submit" value="Send private message" />
								</form>
							</div>
						</div>
					);

				/// user in room can not be kicked 
				} else {
					return (
						<div className="person" key={person.id}>
							<div className="person__login">{person.login}</div>
							<div className="person-wrap">
								<form className="person-form" onSubmit={_this.sendPrivateMessage} data-userid={person.id}>
									<textarea className="person-form__area" ref={"private-" + person.id} placeholder={"Write to " + person.login}></textarea>
									<input className="person__button person__button--form green" type="submit" value="Send private message" />
								</form>
							</div>
						</div>
					);
				}
			}
		});

		// if is admin generate lock button
		var lockButton; 
		if (idOwner == idActiveUser && people.length != 1) {
			if(lockRoom == 'f') {
				lockButton = <a className="chatroom-buttons__item red" href="#" onClick={this.lockRoom} title="Lock the chat room">Lock the room</a>;
			} else {
				lockButton = <a className="chatroom-buttons__item green" href="#" onClick={this.unlockRoom} title="Unlock the chat room">Unlock the room</a>;
			}
		}

		// if last person (= it is admin) can use delete button
		var deleteButton = people.length == 1 ? <a className="chatroom-buttons__item purple" href="#" onClick={this.deleteRoom} title="Delete room">Delete room</a> : "";
			
		// get list of message
		var newMessages = messages.concat(privateMessages),
			sortedMessages =newMessages.sort(_this.sortFunction),
			listMessages = sortedMessages.map(function(message) {
			
			return(
				<div className={message.id_users_to ? "message message--private" : "message"} key={message.id_messages}>
					<div className="message-info">
						<div className="message__name">{message.login}</div>
						<div className="message__date">{message.time} {message.id_users_to ? "- PRIVATE MESSAGE" : ""}</div>
					</div>
					<div className="message__message">{message.message}</div>
				</div>
			);
		});

		// textarea vehaves on enter event
		var textareaBehaviour = function(e) {
			var message = ReactDOM.findDOMNode(_this.refs.message).value;

			 if (message.length > 0 && (e.key) === "Enter") {
			 	e.preventDefault(); // prevent default dehaviour
			 	
			    _this.sendMessage(message); // send message

			    ReactDOM.findDOMNode(_this.refs.message).value = ""; // clear the input
			}
		};

		// complete render
		return (
			<div className="chatroom">
				<div className="chatroom-people">
					<h1 className="chatroom__heading">People in {this.state.title}</h1>
					<div className="chatroom-people__wrap">
						{listPeople}
					</div>
					<div className="chatroom-buttons">
						{/* can use colors red, yellow & blue */}
						{lockButton}
						{deleteButton}
						<a className="chatroom-buttons__item yellow" href="#" onClick={this.leaveRoom} title="Leave the chat room">Leave the room</a>
					</div>
				</div>
				<div className="chatroom-wrap">
					<div className="chatroom-content">
						{listMessages}
						
					</div>
					<form className="chatroom-message">
						<textarea className="chatroom-message__input" ref="message" placeholder="Write a message" onKeyPress={textareaBehaviour}></textarea>
					</form>
				</div>
			</div>
		);
	}
});

// react dom render
ReactDOM.render(
	<ChatRoom delay={3000} kicktime={15} inactivetime={30} />,
	document.getElementById('chatroom')
);