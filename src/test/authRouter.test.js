const { authRouter, setAuthUser } = require("../routes/authRouter");
const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const { Role } = require("../model/model");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };

let testUserAuthToken;
let adminUser;
let testUserId;

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await DB.addUser(user);

  user.password = "toomanysecrets";
  return user;
}

async function getAdminAuthToken() {
  const { email, password } = adminUser;
  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email, password });
  const { token } = loginRes.body;
  return token;
}

async function registerTestUser() {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
}

describe("authRouter", () => {
  beforeAll(async () => {
    await registerTestUser();
    adminUser = await createAdminUser();
  });

  test("register invalid", async () => {
    const responseRes = await request(app)
      .post("/api/auth")
      .send({ name: "test", email: "", password: "test" });
    expect(responseRes.status).toBe(400);
    expect(responseRes.body.message).toBe(
      "name, email, and password are required",
    );
  });

  test("login", async () => {
    const loginRes = await request(app).put("/api/auth").send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(
      /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
    );
    const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
    expect(loginRes.body.user).toMatchObject(user);
  });

  test("logout", async () => {
    const logoutRes = await request(app)
      .delete("/api/auth")
      .set("Authorization", "Bearer " + testUserAuthToken);
    expect(logoutRes.status).toBe(200);
  });

  test("update user no token", async () => {
    const responseRes = await request(app)
      .put("/api/auth/" + testUserId)
      .send({ email: "test", password: "test" });
    expect(responseRes.status).toBe(401);
    expect(responseRes.body.message).toBe("unauthorized");
  });

  test("update user", async () => {
    await registerTestUser();
    const responseRes = await request(app)
      .put("/api/auth/" + testUserId)
      .set("Authorization", "Bearer " + testUserAuthToken)
      .send({ email: testUser.email, password: testUser.password });
    expect(responseRes.status).toBe(200);
    const { password, ...user } = { ...testUser, roles: [{ role: "diner" }] };
    expect(responseRes.body.user).toMatchObject(user);
  });

  test("update user wrong id", async () => {
    await registerTestUser();
    const responseRes = await request(app)
      .put("/api/auth/" + 1)
      .set("Authorization", "Bearer " + testUserAuthToken)
      .send({ email: testUser.email, password: testUser.password });
    expect(responseRes.status).toBe(403);
    expect(responseRes.body.message).toBe("unauthorized");
  });
});
