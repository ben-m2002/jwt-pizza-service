const request = require("supertest");
const app = require("../service");
const { Role } = require("../model/model");
const { DB } = require("../database/database");
const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserId;
let testUserAuthToken;
let adminUser;
let adminUserId;
let adminUserAuthToken;

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function registerTestUser() {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
}

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";
  await DB.addUser(user);
  user.password = "toomanysecrets";
  adminUser = user;
  await getAdminAuthToken();
}

async function getAdminAuthToken() {
  const { email, password } = adminUser;
  const loginRes = await request(app)
    .put("/api/auth")
    .send({ email, password });
  adminUserAuthToken = loginRes.body.token;
  adminUserId = loginRes.body.user.id;
}

function getTestUserId() {
  return testUserId;
}
function getTestUserAuthToken() {
  return testUserAuthToken;
}

function getAdminUserId() {
  return adminUserId;
}
function getAdminUserAuthToken() {
  return adminUserAuthToken;
}

function getAdminUser() {
  return adminUser;
}

module.exports = {
  randomName,
  registerTestUser,
  getTestUserId,
  getTestUserAuthToken,
  getAdminUser,
  testUser,
  createAdminUser,
  getAdminAuthToken,
  getAdminUserId,
  getAdminUserAuthToken,
};
