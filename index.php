<?php

// salt function for getting salr of 10 chars
function getSalt() {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $salt = '';
    for ($i = 0; $i < 10; $i++) {
        $salt .= $characters[rand(0, $charactersLength - 1)];
    }
    return $salt;
}

use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;

require 'app/backend/vendor/autoload.php';
require 'app/backend/settings/config.php';

$c = new \Slim\Container(["settings" => $config]); // Created container

$c['url'] = '/school/chat-app-new/';

//Override the default Not Found Handler
$c['notFoundHandler'] = function ($c) {
    return function ($request, $response) use ($c) {
        return $response->withRedirect($c['url']);
    };
};

$app = new \Slim\App($c);
$container = $app->getContainer();
$container['view'] = new \Slim\Views\PhpRenderer("app/backend/templates/");
$container['db'] = function ($c) {
    $db = $c['settings']['db'];
    $pdo = new PDO("mysql:host=" . $db['host'] . ";dbname=" . $db['dbname'], $db['user'], $db['pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    return $pdo;
};
session_start();

//
//
// group pages for NON logged user
//
//

$app->group('', function() {

    //
    // default viewing by GET method
    //
    // pages: login, signup, introduce
    //

    $this->get('/', function (Request $request, Response $response) {
        $response = $this->view->render($response, "introduce.phtml");
        return $response;
    });

    $this->get('/login', function (Request $request, Response $response) {
        $response = $this->view->render($response, "login.phtml");
        return $response;
    });

    $this->get('/signup', function (Request $request, Response $response) {
        $response = $this->view->render($response, "signup.phtml");
        return $response;
    });


    //
    // LOGIN
    //

    $this->post('/login', function (Request $request, Response $response) {

        $message = "";
        $page = "";
        $data = $request->getParsedBody();
        
        if(isset($data["password"])) {

            try {
                // get user
                $stmt = $this->db->prepare("SELECT * FROM users WHERE login = :login");
                $stmt->bindValue(":login", $data['login']);
                $stmt->execute();
                $user = $stmt->fetch();

                // if exist
                if($user) {
                    $user_psw = sha1($data['password'] . $user['pass_salt']);

                    // password is ok
                    if($user_psw == $user['pass_hash']) {
                        $_SESSION['user'] = $user['login'];
                        $_SESSION['userId'] = $user['id'];
                        $page = "main";
                    // if password is not ok
                    } else {
                        $message = 1;
                    }
                // if doesnt exist
                } else {
                     $message = 2;
                }

            } catch(PDOException $e) {
                return $response->withJson([
                    "message" => $e->getMessage()
                ], 500);
            }
        }

        return $response->withJson(array($page, $message));

    });

    //
    // SIGNUP
    //

    $this->post('/signup', function (Request $request, Response $response) {

        $page = "";
        $message = 0;
        $data = $request->getParsedBody();

        // creating salt
        $salt = getSalt();

        try {
            // get user
            $stmt = $this->db->prepare("SELECT * FROM users WHERE login = :login");
            $stmt->bindValue(":login", $data['login']);
            $stmt->execute();
            $user = $stmt->fetch();

            // if exists
            if($user) {
                $message = 1;
            // if NOT exists
            } else {

                 try {
                    // inserting new record of user
                    $stmt = $this->db->prepare("INSERT INTO users (login, email, pass_hash, pass_salt, name, registered) VALUES (:login, :email, :pass_hash, :pass_salt, :name, :registered)");
                    $stmt->bindValue(":login", $data['login']);
                    $stmt->bindValue(":email", $data['email']);
                    $stmt->bindValue(":pass_hash", sha1($data['password'] . $salt)); // hash
                    $stmt->bindValue(":pass_salt", $salt); // salt
                    $stmt->bindValue(":name", $data['login']);
                    $stmt->bindValue(":registered", date("Y-m-d H:i:s", time())); // data
                    $stmt->execute();

                    $_SESSION['user'] = $data['login']; // set session
                    $_SESSION['userId'] = $this->db->lastInsertId();
                    $page = "main";

                } catch(PDOException $e) {
                    return $response->withJson([
                        "message" => $e->getMessage()
                    ], 500);
                }
            }

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array($page, $message));

    });

})->add(function($request, $response, $next) {

    // if user is set - > redirect to main page
    if(isset($_SESSION['user'])) {
        return $response->withRedirect($c['url'] . 'main');
    }
    $response = $next($request, $response);
    return $response;
});

//
// LOGOUT
//

$app->get('/logout', function (Request $request, Response $response) {
    $response = $this->view->render($response, "introduce.phtml");
    unset($_SESSION['user']);
    return $response;
});

//
//
// group pages for logged user
//
//

$app->group('', function() {

    //
    // main GET
    //
   
    $this->get('/main', function (Request $request, Response $response) {

        $response = $this->view->render($response, "main.phtml");
        return $response;
    });

    //
    // POST main
    //

    $this->post('/main', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $user;
        $inRoom;
        
        if(isset($_SESSION['user'])) {

            try {
                // select user
                $stmt = $this->db->prepare("SELECT id, login,  name, surname, email, gender FROM users WHERE login = :login");
                $stmt->bindValue(":login", $_SESSION['user']);
                $stmt->execute();
                $user = $stmt->fetch();

                // select kicked from in_room
                $stmt1 = $this->db->prepare("SELECT id_users, id_rooms, kicked FROM in_room WHERE id_users = :id");
                $stmt1->bindValue(":id", $_SESSION['userId']);
                $stmt1->execute();
                $inRoom = $stmt1->fetch();

            } catch(PDOException $e) {
                return $response->withJson([
                    "message" => $e->getMessage()
                ], 500);
            }
        }

        return $response->withJson(array(
            "user" => $user,
            "inRoom" => $inRoom
        ));
        
    });

    //
    // method on control password
    //

    $this->post('/psw', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $message = false;
        
        if(isset($_SESSION['user'])) {

            try {
                // select user
                $stmt = $this->db->prepare("SELECT * FROM users WHERE login = :login");
                $stmt->bindValue(":login", $_SESSION['user']);
                $stmt->execute();
                $user = $stmt->fetch();

                // if exists
                if($user) {
                    $user_psw = sha1($data['password'] . $user['pass_salt']);

                    // if password is ok, can change
                    if($user_psw == $user['pass_hash']) {
                        $message = true;
                    }
                }

            } catch(PDOException $e) {
                return $response->withJson([
                    "message" => $e->getMessage()
                ], 500);
            }
        }

        return $response->withJson($message);
        
    });

    //
    // editing basic information
    //

    $this->post('/editbasic', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        
        // if user session is set
        if(isset($_SESSION['user'])) {

            try {
                // update basic user information
                $stmt = $this->db->prepare("UPDATE users SET name = :name, surname = :surname, email = :email, gender = :gender WHERE login = :login");
                $stmt->bindValue(":name", $data['name']);
                $stmt->bindValue(":surname", $data['surname']);
                $stmt->bindValue(":email", $data['email']);
                $stmt->bindValue(":gender", $data['gender']);
                $stmt->bindValue(":login", $_SESSION['user']);
                $stmt->execute();

            } catch(PDOException $e) {
                return $response->withJson([
                    "message" => $e->getMessage()
                ], 500);
            }
        }

        return $response->withJson(true);
    });

    //
    // editing basic information including passwords
    //

    $this->post('/editall', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $salt = getSalt();
        
        // if user session is set
        if(isset($_SESSION['user'])) {

            try {
                // update basic information including passwords
                $stmt = $this->db->prepare("UPDATE users SET name = :name, surname = :surname, email = :email, gender = :gender, pass_salt = :pass_salt, pass_hash = :pass_hash WHERE login = :login");
                $stmt->bindValue(":name", $data['name']);
                $stmt->bindValue(":surname", $data['surname']);
                $stmt->bindValue(":email", $data['email']);
                $stmt->bindValue(":gender", $data['gender']);
                $stmt->bindValue(":pass_hash", sha1($data['newPassword'] . $salt)); // hash
                $stmt->bindValue(":pass_salt", $salt); // salt
                $stmt->bindValue(":login", $_SESSION['user']);
                $stmt->execute();

            } catch(PDOException $e) {
                return $response->withJson([
                    "message" => $e->getMessage()
                ], 500);
            }
        }

        return $response->withJson(true);
    });

    //
    // get chat rooms
    //

    $this->post('/getchatrooms', function (Request $request, Response $response) {

        $rooms;

        try {
            // select all chat rooms
            $stmt = $this->db->prepare("SELECT * FROM rooms");
            $stmt->execute();
            $rooms = $stmt->fetchAll();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("rooms" => $rooms));
    });

    // 
    // create room
    //

    $this->post('/createroom', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $roomId;

        try {
            // create new room
            $stmt = $this->db->prepare("INSERT INTO rooms (created, title, id_users_owner, lock_room) VALUES (:created, :title, :id_users_owner, :lock_room)");
            $stmt->bindValue(":created", date("Y-m-d H:i:s", time()));
            $stmt->bindValue(":title", $data['title']);
            $stmt->bindValue(":id_users_owner", $_SESSION['userId']); // actual user id
            $stmt->bindValue(":lock_room", 'f'); // default
            $stmt->execute();
            $roomId = $this->db->lastInsertId();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("roomId" => $roomId));
    });

    // 
    // GET chat room
    //

    $this->get('/chatroom/{id}', function (Request $request, Response $response, $args) {

        $response = $this->view->render($response, "chatroom.phtml");
        return $response;
    });

    // 
    // POST chat room
    //

    $this->post('/chatroom/{id}', function (Request $request, Response $response, $args) {

        $id = $args['id'];
        $people;
        $roomInfo;
        $messages;

        try {
            // control wether logged person is in room
            $stmt = $this->db->prepare("SELECT users.login FROM users INNER JOIN in_room ON users.id = in_room.id_users WHERE users.id = :id");
            $stmt->bindValue(':id', $_SESSION['userId']);
            $stmt->execute();
            $personIn = $stmt->fetch();

             // select room
            $stmt1 = $this->db->prepare("SELECT id, title, id_users_owner, lock_room FROM rooms WHERE id = :id");
            $stmt1->bindValue(':id', $id);
            $stmt1->execute();
            $roomInfo = $stmt1->fetch();
            $roomInfo['userId'] = $_SESSION['userId'];
            $roomInfo['login'] = $_SESSION['user'];

            // insert new record in_room if person is NOt in room and room is NOT locked
            if(!$personIn) {
                if($roomInfo['lock_room'] == 'f') {
                    $stmt2 = $this->db->prepare("INSERT INTO in_room (id_users, id_rooms, entered) VALUES (:id_users, :id_rooms, :entered)");
                    $stmt2->bindValue(':id_users', $_SESSION['userId']);
                    $stmt2->bindValue(':id_rooms', $id);
                    $stmt2->bindValue(':entered', date("Y-m-d H:i:s", time()));
                    $stmt2->execute();
                } else {
                    $app->redirect('/main');
                }
            }

            // select people in room
            $stmt3 = $this->db->prepare("SELECT users.login, users.id, in_room.last_message, in_room.entered, in_room.kicked FROM users INNER JOIN in_room ON users.id = in_room.id_users WHERE in_room.id_rooms = :id");
            $stmt3->bindValue(':id', $id);
            $stmt3->execute();
            $people = $stmt3->fetchAll();

            // if is the last person in room, set him admin's right
            if(count($people) == 1) {
                $roomInfo['id_users_owner'] = $_SESSION['userId'];

                $stmt4 = $this->db->prepare("UPDATE rooms SET id_users_owner = :id_users_owner WHERE id = :id");
                $stmt4->bindValue(':id_users_owner', $_SESSION['userId']);
                $stmt4->bindValue(':id', $id);
                $stmt4->execute();
            }

            // get messages
            $stmt5 = $this->db->prepare("SELECT users.id, users.login, messages.message, messages.time FROM messages INNER JOIN rooms ON messages.id_rooms = rooms.id INNER JOIN users ON messages.id_users_from = users.id WHERE rooms.id = :id AND messages.id_users_to IS NULL ORDER BY time DESC");
            $stmt5->bindValue(':id', $id);
            $stmt5->execute();
            $messages = $stmt5->fetchAll();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "roomInfo" => $roomInfo,
            "people" => $people,
            "messages" => $messages
        ));
    });

    // 
    // get people
    //

    $this->post('/people', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $people;
        $roomInfo;

        try {
            // select users
            $stmt1 = $this->db->prepare("SELECT users.login, users.id, in_room.last_message, in_room.entered, in_room.kicked FROM users INNER JOIN in_room ON users.id = in_room.id_users WHERE in_room.id_rooms = :id");
            $stmt1->bindValue(':id', $data['id']);
            $stmt1->execute();
            $people = $stmt1->fetchAll();

            // select admin
            $stmt2 = $this->db->prepare("SELECT id_users_owner FROM rooms WHERE id = :id");
            $stmt2->bindValue(':id', $data['id']);
            $stmt2->execute();
            $roomInfo = $stmt2->fetch();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "roomInfo" => $roomInfo,
            "people" => $people

        ));
    });

    //
    // leaving room
    //

    $this->post('/leaveroom', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $message;

        try {
            // delete record from in_room
            $stmt1 = $this->db->prepare("DELETE FROM in_room WHERE id_rooms = :id_rooms AND id_users = :id_users");
            $stmt1->bindValue(':id_rooms', $data['id']);
            $stmt1->bindValue(':id_users', isset($data['idKickedUser']) ? $data['idKickedUser'] : $_SESSION['userId']);
            $message = $stmt1->execute();

            // if is last used
            if($data['lastUsed']) {
                $stmt2 = $this->db->prepare("UPDATE rooms SET last_used = :last_used, id_users_owner = NULL WHERE id = :id");
                $stmt2->bindValue(':id', $data['id']);
                $stmt2->bindValue(':last_used', date("Y-m-d H:i:s", time()));
                $message = $stmt2->execute();
            }


        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("response" => $message));
    });

    //
    // lock room
    //

    $this->post('/lockroom', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $message;

        try {
            // update record according to room id
            $stmt = $this->db->prepare("UPDATE rooms SET lock_room = 't' WHERE id = :id");
            $stmt->bindValue(':id', $data['id']);
            $message = $stmt->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("response" => $message));
    });

    //
    // unlock room
    //

    $this->post('/unlockroom', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $message;

        try {
            // update record according to room id
            $stmt = $this->db->prepare("UPDATE rooms SET lock_room = 'f' WHERE id = :id");
            $stmt->bindValue(':id', $data['id']);
            $message = $stmt->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("response" => $message));
    });

    //
    // delete room
    //

    $this->post('/deleteroom', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $message;

        try {
            // delete room
            $stmt = $this->db->prepare("DELETE FROM rooms WHERE id = :id");
            $stmt->bindValue(':id', $data['id']);
            $message = $stmt->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("response" => $message));
    });

    //
    // set new owner of room
    //

    $this->post('/setnewroomowner', function (Request $request, Response $response) {

        $data = $request->getParsedBody();

        try {
            // update record of rooms according room id
            $stmt = $this->db->prepare("UPDATE rooms SET id_users_owner = :id_user WHERE id = :id_room");
            $stmt->bindValue(':id_room', $data['id']);
            $stmt->bindValue(':id_user', $data['newUserOwner']);
            $message = $stmt->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array("id" => $data['newUserOwner']));
    });

    //
    // get messages which are NOT private
    //

    $this->post('/messages', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $messages;

        try {
            // get messages which are NOT private
            $stmt1 = $this->db->prepare("SELECT users.id, users.login, messages.message, messages.time FROM messages INNER JOIN rooms ON messages.id_rooms = rooms.id INNER JOIN users ON messages.id_users_from = users.id WHERE rooms.id = :id AND messages.id_users_to IS NULL ORDER BY time DESC");
            $stmt1->bindValue(':id', $data['id']);
            $stmt1->execute();
            $messages = $stmt1->fetchAll();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "messages" => $messages

        ));
    });

    //
    // get messages which are private
    //

    $this->post('/getprivate', function (Request $request, Response $response) {

        $messages;

        try {
            // get messages which are private
            $stmt1 = $this->db->prepare("SELECT users.id, users.login, messages.message, messages.time, messages.id_users_to FROM messages INNER JOIN rooms ON messages.id_rooms = rooms.id INNER JOIN users ON messages.id_users_from = users.id WHERE messages.id_users_to IS NOT NULL AND messages.id_users_to = :id ORDER BY time DESC");
            $stmt1->bindValue(':id', $_SESSION['userId']);
            $stmt1->execute();
            $messages = $stmt1->fetchAll();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "messages" => $messages
        ));
    });

    //
    // send message
    //

    $this->post('/sendmessage', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $time = date("Y-m-d H:i:s", time());

        try {
            // new message
            $stmt1 = $this->db->prepare("INSERT INTO messages (id_rooms, id_users_from, id_users_to, time, message) VALUES (:id_rooms, :id_users_from, :id_users_to, :time, :message)");
            $stmt1->bindValue(':id_rooms', $data['idRoom']);
            $stmt1->bindValue(':id_users_from', $data['idUserFrom']);
            $stmt1->bindValue(':id_users_to', $data['idUserTo'] == 0 ? null : $data['idUserTo']); // if it is private or NOT
            $stmt1->bindValue(':time', $time);
            $stmt1->bindValue(':message', $data['message']);
            $stmt1->execute();

            // update last_message in in_room table
            $stmt2 = $this->db->prepare("UPDATE in_room SET last_message = :last_message WHERE id_users = :id_users AND id_rooms = :id_rooms");
            $stmt2->bindValue(':id_users', $data['idUserFrom']);
            $stmt2->bindValue(':id_rooms', $data['idRoom']);
            $stmt2->bindValue(':last_message', $time);
            $stmt2->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "time" => $time
        ));
    });

    //
    // kick person
    //

    $this->post('/kickperson', function (Request $request, Response $response) {

        $data = $request->getParsedBody();
        $time = date("Y-m-d H:i:s", time());

        try {
            // update kicked time in in_room table
            $stmt = $this->db->prepare("UPDATE in_room SET kicked = :time WHERE id_users = :id_users");
            $stmt->bindValue(':time', $time);
            $stmt->bindValue(':id_users', $data['idKickedPerson']);
            $stmt->execute();

        } catch(PDOException $e) {
            return $response->withJson([
                "message" => $e->getMessage()
            ], 500);
        }

        return $response->withJson(array(
            "time" => $time
        ));
    });


})->add(function($request, $response, $next) {

    // if user is NOT set -> redirect to login page

    if(!isset($_SESSION['user'])) {
        return $response->withRedirect($c['url'] . 'login');
    } 
    $response = $next($request, $response);
    return $response;
});

// run
$app->run();