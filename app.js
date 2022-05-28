const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Error is ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const priorityList = ["HIGH", "MEDIUM", "LOW"];
const statusList = ["TO DO", "IN PROGRESS", "DONE"];
const categoryList = ["WORK", "HOME", "LEARNING"];

const convertTableDbIntoDbObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery;
  const {
    search_q = "",
    todo,
    priority,
    status,
    category,
    dueDate,
  } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                AND
                    status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                AND
                    priority = '${priority}';`;
      break;
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    priority = '${priority}'
                AND 
                    status = '${status}';`;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                AND
                    category = '${category}'
                AND
                    status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                AND
                    category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodoQuery = `
                SELECT
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                AND
                    category = '${category}'
                AND
                    priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data.map((todo) => convertTableDbIntoDbObject(todo)));
});

// API 2 Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
        *
        FROM
            todo
        WHERE 
            id = ${todoId};`;
  const data = await db.get(getTodoQuery);
  response.send(convertTableDbIntoDbObject(data));
});

// API 3  Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateObj = new Date(date);
  const formattedDate = format(dateObj, "yyyy-MM-dd");
  const getDateQuery = `
        SELECT
            *
        FROM
            todo
        WHERE 
            due_date = '${formattedDate}';
    `;
  const data = await db.all(getDateQuery);
  console.log(`type of data is ${typeof data}`);
  if (data) {
    response.send(data.map((todo) => convertTableDbIntoDbObject(todo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4 CREATE A TODO LIST IN THE TABLE

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(id);
  console.log(todo);

  const postTodoQuery = `
        INSERT INTO 
            todo (id, todo, priority, status, category, due_date)
        VALUES (
            ${id}, 
            '${todo}', 
            '${priority}', 
            '${status}', 
            '${category}', 
            '${dueDate}'
            );`;

  const data = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, status, category, priority, dueDate } = request.body;
  const date = new Date(dueDate);
  const formattedDate = format(date, "yyyy-MM-dd");
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody.status);

  if (requestBody.status === undefined) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else {
    updateColumn = "Status";
  }
  if (requestBody.category === undefined) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    updateColumn = "Category";
  }
  if (requestBody.priority === undefined) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else {
    updateColumn = "Priority";
  }
  if (requestBody.todo === undefined) {
    response.status(400);
    response.send("Invalid Todo");
  } else {
    updateColumn = "Todo";
  }
  if (formattedDate === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    updateColumn = "Due Date";
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    myTodo = previousTodo.todo,
    myPriority = previousTodo.priority,
    myStatus = previousTodo.status,
    myCategory = previousTodo.category,
    myDueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${myTodo}',
      priority='${myPriority}',
      status='${myStatus}',
      category = '${myCategory}',
      due_date = '${formattedDate}',
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 6 Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE
        FROM
            todo
        WHERE 
            id = ${todoId};`;
  const deleted = await db.run(deleteQuery);
  if (deleted === undefined) {
    response.send(400);
    response.send("Invalid Todo Id");
  } else {
    response.send("Todo Deleted");
  }
  console.log(deleted);
});

module.exports = app;
