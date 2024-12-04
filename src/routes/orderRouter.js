const express = require("express");
const config = require("../config.js");
const { Role, DB } = require("../database/database.js");
const { authRouter } = require("./authRouter.js");
const { asyncHandler, StatusCodeError } = require("../endpointHelper.js");
const metrics = require("../metrics");
const Logger = require("../Logger");

const orderRouter = express.Router();
orderRouter.use(Logger.httpLogger);
orderRouter.use(metrics.measureLatency);
orderRouter.use(metrics.measurePizzaLatency);

orderRouter.endpoints = [
  {
    method: "GET",
    path: "/api/order/menu",
    description: "Get the pizza menu",
    example: `curl localhost:3000/api/order/menu`,
    response: [
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
    ],
  },
  {
    method: "PUT",
    path: "/api/order/menu",
    requiresAuth: true,
    description: "Add an item to the menu",
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [
      {
        id: 1,
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      },
    ],
  },
  {
    method: "GET",
    path: "/api/order",
    requiresAuth: true,
    description: "Get the orders for the authenticated user",
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: {
      dinerId: 4,
      orders: [
        {
          id: 1,
          franchiseId: 1,
          storeId: 1,
          date: "2024-06-05T05:14:40.000Z",
          items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
        },
      ],
      page: 1,
    },
  },
  {
    method: "POST",
    path: "/api/order",
    requiresAuth: true,
    description: "Create a order for the authenticated user",
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: {
      order: {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
        id: 1,
      },
      jwt: "1111111111",
    },
  },
];

// getMenu
orderRouter.get(
  "/menu",
  asyncHandler(async (req, res) => {
    try {
      metrics.incrementRequests("GET");
      res.send(await DB.getMenu());
    } catch (error) {
      Logger.log("error", "error", { message: error.message });
      res
        .status(500)
        .json({ message: "An error occurred while fetching the menu" });
    }
  }),
);

// addMenuItem
orderRouter.put(
  "/menu",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      metrics.incrementRequests("PUT");
      metrics.updateActiveUsers(authRouter.authenticateToken);
      if (!req.user.isRole(Role.Admin)) {
        metrics.incrementAuthFailures();
        throw new StatusCodeError("unable to add menu item", 403);
      }
      metrics.incrementAuthSuccesses();
      const addMenuItemReq = req.body;
      await DB.addMenuItem(addMenuItemReq);
      res.send(await DB.getMenu());
    } catch (error) {
      Logger.log("error", "error", { message: error.message });
      res
        .status(error.statusCode || 500)
        .json({
          message:
            error.message || "An error occurred while adding a menu item",
        });
    }
  }),
);

// getOrders
orderRouter.get(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      metrics.incrementRequests("GET");
      metrics.updateActiveUsers(authRouter.authenticateToken);
      res.json(await DB.getOrders(req.user, req.query.page));
    } catch (error) {
      Logger.log("error", "error", { message: error.message });
      res
        .status(500)
        .json({ message: "An error occurred while fetching orders" });
    }
  }),
);

// createOrder
orderRouter.post(
  "/",
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      metrics.incrementRequests("POST");
      metrics.updateActiveUsers(authRouter.authenticateToken);
      const orderReq = req.body;
      const order = await DB.addDinerOrder(req.user, orderReq);
      const r = await fetch(`${config.factory.url}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${config.factory.apiKey}`,
        },
        body: JSON.stringify({
          diner: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          },
          order,
        }),
      });
      const j = await r.json();
      Logger.log("info", "FactoryOrder", { order, j, jwt: j.jwt });
      if (r.ok) {
        metrics.updatePizzasSold(order.items.length);
        metrics.updateRevenue(0.004);
        res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });
      } else {
        metrics.incrementCreationFailed();
        res.status(500).send({
          message: "Failed to fulfill order at factory",
          reportUrl: j.reportUrl,
        });
      }
    } catch (error) {
      Logger.log("error", "error", { message: error.message });
      res
        .status(500)
        .json({ message: "An error occurred while creating the order" });
    }
  }),
);

module.exports = orderRouter;
