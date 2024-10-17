const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const {
  registerTestUser,
  getTestUserId,
  getTestUserAuthToken,
  createAdminUser,
  getAdminUserAuthToken,
} = require("./testHelpers");

describe("orderRouter", () => {
  beforeAll(async () => {
    await DB.initializeDatabase();
    await createAdminUser();
    await registerTestUser();
    await DB.addMenuItem({
      title: "Veggie",
      description: "A garden of delight",
      image: "pizza1.png",
      price: 0.0038,
    });
  });

  test("GET /api/order/menu", async () => {
    const res = await request(app).get("/api/order/menu");
    expect(res.body).toEqual([
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
    ]);
  });

  test("PUT /api/order/menu", async () => {
    const res = await request(app)
      .put("/api/order/menu")
      .send({
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      })
      .set("Authorization", `Bearer ${getAdminUserAuthToken()}`);
    expect(res.body).toEqual([
      {
        id: 1,
        title: "Veggie",
        image: "pizza1.png",
        price: 0.0038,
        description: "A garden of delight",
      },
      {
        id: 2,
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      },
    ]);
  });

  test("PUT /api/order/menu bad auth", async () => {
    const res = await request(app)
      .put("/api/order/menu")
      .send({
        title: "Student",
        description: "No topping, no sauce, just carbs",
        image: "pizza9.png",
        price: 0.0001,
      })
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(res.status).toBe(403);
  });

  test("POST /api/order", async () => {
    const res = await request(app)
      .post("/api/order")
      .send({
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
      })
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(res.body).toEqual({
      order: {
        franchiseId: 1,
        storeId: 1,
        items: [{ menuId: 1, description: "Veggie", price: 0.0038 }],
        id: 1,
      },
      jwt: expect.any(String),
    });
  });

  test("Get User Orders", async () => {
    const res = await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(res.body).toEqual({
      dinerId: getTestUserId(),
      orders: [
        {
          id: expect.any(Number),
          franchiseId: 1,
          storeId: 1,
          date: expect.any(String),
          items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.0038 }],
        },
      ],
      page: 1,
    });
  });

  afterAll(async () => {});
});
