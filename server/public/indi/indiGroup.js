//selectors
const todoInput = document.querySelector(".todo-input");
const todoButton = document.querySelector(".todo-button");
const todoList = document.querySelector(".todo-list");
const filterOption = document.querySelector(".todo-filter");
const header = document.querySelector(".head");
const select = document.querySelector(".select");
const inp = document.querySelector(".inp");
const logout = document.querySelector(".logout");
const leaveBtn = document.querySelector(".leave");
const memberList = document.querySelector(".member-list");
const socket = io();
let group;
let complete = [],
  todos = [];

let groupID = JSON.parse(sessionStorage.getItem("group"));

fetchcomplete(), fetchtodo();
fetchname();
//page load animation
const tl = new TimelineMax();
tl.fromTo(
  header,
  1,
  { opacity: "0", y: "10%" },
  { opacity: "1", y: "0%", ease: Power2.easeInOut }
)
  .fromTo(
    inp,
    1,
    { x: "-10%", opacity: "0" },
    { x: "0%", opacity: "1", ease: Power2.easeInOut },
    "-=1"
  )
  .fromTo(
    select,
    1,
    { x: "10%", opacity: "0" },
    { x: "0%", opacity: "1", ease: Power2.easeInOut },
    "-=1"
  );

//event listeners
document.addEventListener("DOMContentLoaded", getTodos);
document.addEventListener("DOMContentLoaded", getMembers);
todoButton.addEventListener("click", addTodo);
todoList.addEventListener("click", checkDelete);
filterOption.addEventListener("click", filterTodo);
leaveBtn.addEventListener("click", leaveGroup);
//functions

async function getMembers() {
  fetch(`/api/indigroup/getmembers/${groupID}`)
    .then((res) => res.json())
    .then((members) => {
      members.forEach((member) => {
        fetch(`/groups/api/group/getmembername/${member}`)
          .then((res) => res.text())
          .then((name) => {
            let li = document.createElement("li");
            li.innerText = name;
            memberList.appendChild(li);
          });
      });
    });
}

async function leaveGroup() {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    redirect: "follow",
  };
  await fetch(`/api/indigroup/leavegroup/${groupID}`, requestOptions);
  console.log("user left");
  window.location.replace("/groups/group.html");
}

async function fetchname() {
  fetch(`/api/indigroup/getname/${groupID}`)
    .then((response) => response.text())
    .then((result) => {
      group = result;
      socket.emit("joinGroup", group);
      document.querySelector(".head").innerText += ` ${result.toUpperCase()}`;
    });
}

socket.on("todoValue", ({ todo, name }) => {
  console.log(todo, name);
  addTodoDiv(todo, name);
});
socket.on("comp_index", (index) => {
  todoList.children[index].children[1].classList.toggle("completed");
  todoList.children[index].children[2].classList.toggle("green");
});
socket.on("del_index", (index) => {
  let todo = todoList.children[index];
  todo.classList.add("fall");
  todo.addEventListener("transitionend", () => {
    todo.remove();
  });
});

function addTodo(event) {
  //prevent default action ie form to submit
  event.preventDefault();
  if (todoInput.value != "") {
    //emit message to server
    let todo = todoInput.value;
    fetch("/api/user/getname")
      .then((res) => res.text())
      .then((name) => {
        saveLocalTodos(todoInput.value);
        makeComplete();
        socket.emit("todo", { todo, name });
      });
    //add todo to localstorage
  } else {
    todoInput.classList.add("shake");
    todoInput.addEventListener("animationend", () => {
      todoInput.classList.remove("shake");
    });
  }
}

function checkDelete(e) {
  const item = e.target;
  if (item.classList[0] == "edit-btn") {
    const todo = item.parentElement;
    todoInput.value = todo.children[1].innerText;
    todoInput.focus();
    removelocalTodos(todo);
    todo.remove();
  }

  if (item.classList[0] === "delete-btn") {
    const todo = item.parentElement;
    todo.classList.add("fall");
    removelocalTodos(todo);

    todo.addEventListener("transitionend", () => {
      todo.remove();
    });
  }
  if (item.classList[0] === "completed-btn") {
    fetch(`/api/indigroup/getcomplete/${groupID}`)
      .then((response) => response.json())
      .then((complete) => {
        const todo = item.parentElement;
        todo.children[1].classList.toggle("completed");
        todo.children[2].classList.toggle("green");

        const text = todo.children[1].innerText;

        fetch(`/api/indigroup/gettodo/${groupID}`)
          .then((response) => response.json())
          .then((todos) => {
            const index = todos.indexOf(text);
            socket.emit("complete_index", index);
            updatecomplete(index, !complete[index]);
            console.log(index, complete, text, todos);
          });
      });
  }
}

function updatecomplete(index, value) {
  var myHeaders = new Headers();
  const data = { index: index, complete: value };
  const raw = JSON.stringify(data);
  myHeaders.append("Content-Type", "application/json");
  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(`/api/indigroup/updatecomplete/${groupID}`, requestOptions);
}

function filterTodo(e) {
  const todos = todoList.childNodes;
  console.log(todos);
  todos.forEach(function (item) {
    switch (e.target.value) {
      case "all":
        item.style.display = "flex";
        break;
      case "completed":
        if (item.children[1].classList.contains("completed")) {
          item.style.display = "flex";
        } else item.style.display = "none";
        break;
      case "not-completed":
        if (!item.children[1].classList.contains("completed")) {
          item.style.display = "flex";
        } else item.style.display = "none";
        break;
    }
  });
}

function saveLocalTodos(todo) {
  console.log("saving todos!");

  const data = { todo: todo };
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify(data);

  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(`/api/indigroup/addtodo/${groupID}`, requestOptions);
  fetch(`/api/indigroup/addwhosetodo/${groupID}`, requestOptions);
}

function getTodos() {
  let names = [];
  fetch(`/api/indigroup/whosetodo/${groupID}`)
    .then((res) => res.json())
    .then((nameList) => (names = nameList));

  fetch(`/api/indigroup/gettodo/${groupID}`)
    .then((response) => response.json())
    .then((todos) => {
      console.log(todos);
      for (let i = 0; i < todos.length; ++i) {
        const todoDiv = document.createElement("div");
        todoDiv.classList.add("todo");

        const userName = document.createElement("span");
        userName.classList.add("name-span");
        userName.innerText = `${names[i]}:`;
        todoDiv.appendChild(userName);

        //Create li
        const newTodo = document.createElement("li");
        newTodo.classList.add("todo-item");
        newTodo.innerText = todos[i];
        todoDiv.appendChild(newTodo);

        //task completed button
        const completedButton = document.createElement("button");
        completedButton.innerHTML = '<i class="fa fa-check"></i>';
        completedButton.classList.add("completed-btn");
        todoDiv.appendChild(completedButton);

        const editButton = document.createElement("button");
        editButton.innerHTML = '<i class="fa fa-pencil"></i>';
        editButton.classList.add("edit-btn");
        todoDiv.appendChild(editButton);

        //delete task button
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = '<i class="fa fa-trash"></i>';
        deleteButton.classList.add("delete-btn");
        todoDiv.appendChild(deleteButton);

        //Append div to ul
        todoList.appendChild(todoDiv);
      }
      // const complete = JSON.parse(localStorage.getItem('complete'));

      fetch(`/api/indigroup/getcomplete/${groupID}`)
        .then((response) => response.json())
        .then((complete) => {
          const Todos = todoList.childNodes;
          for (let i = 0; i < Todos.length; ++i) {
            if (complete[i]) {
              Todos[i].children[1].classList.toggle("completed");
              Todos[i].children[2].classList.add("green");
            }
          }
        });
    });
}

function removelocalTodos(todo) {
  const deltodo = todo.children[1].innerText;

  fetch(`/api/indigroup/gettodo/${groupID}`)
    .then((response) => response.json())
    .then((todos) => {
      const index = todos.indexOf(deltodo);
      socket.emit("delete_index", index);
      const data = { index: index };
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      console.log(todos);
      const raw = JSON.stringify(data);

      var requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };
      fetch(`/api/indigroup/deletecomplete/${groupID}`, requestOptions);
      fetch(`/api/indigroup/deletewhosetodo/${groupID}`, requestOptions);

      const data2 = { todo: deltodo };
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const raw2 = JSON.stringify(data2);

      var requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw2,
        redirect: "follow",
      };

      fetch(`/api/indigroup/deletetodo/${groupID}`, requestOptions);
    });
}

function makeComplete() {
  const data = { complete: false };
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify(data);

  var requestOptions = {
    method: "PUT",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(`/api/indigroup/addcomplete/${groupID}`, requestOptions);
}

async function fetchcomplete() {
  fetch(`/api/indigroup/getcomplete/${groupID}`)
    .then((response) => response.json())
    .then((res) => {
      complete = res;
    });
}

async function fetchtodo() {
  fetch(`/api/indigroup/gettodo/${groupID}`)
    .then((response) => response.json())
    .then((res) => {
      todos = res;
    });
}

function addTodoDiv(todo, username) {
  //add todo div
  const todoDiv = document.createElement("div");
  todoDiv.classList.add("todo");

  const userName = document.createElement("span");
  userName.classList.add("name-span");
  if (!username) {
    fetch("/api/user/getname")
      .then((res) => res.text())
      .then((name) => (userName.innerText = `${name}: `));
  } else {
    userName.innerText = username;
  }
  todoDiv.appendChild(userName);

  //Create li
  const newTodo = document.createElement("li");
  newTodo.classList.add("todo-item");
  newTodo.innerText = todo;
  todoDiv.appendChild(newTodo);
  //task completed button
  const completedButton = document.createElement("button");
  completedButton.innerHTML = '<i class="fa fa-check"></i>';
  completedButton.classList.add("completed-btn");
  todoDiv.appendChild(completedButton);

  const editButton = document.createElement("button");
  editButton.innerHTML = '<i class="fa fa-pencil"></i>';
  editButton.classList.add("edit-btn");
  todoDiv.appendChild(editButton);

  //delete task button
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = '<i class="fa fa-trash"></i>';
  deleteButton.classList.add("delete-btn");
  todoDiv.appendChild(deleteButton);

  //Append div to ul
  todoList.appendChild(todoDiv);

  //clear writer
  todoInput.value = "";
}
