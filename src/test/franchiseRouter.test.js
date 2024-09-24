const { franchiseRouter } = require("../routes/franchiseRouter");
const request = require("supertest");
const { randomName } = require("./testHelpers");
const app = require("../service");
const { DB } = require("../database/database.js");
const {
  testUser,
  registerTestUser,
  getTestUserId,
  getTestUserAuthToken,
  createAdminUser,
  getAdminAuthToken,
  getAdminUserId,
  getAdminUser,
  getAdminUserAuthToken,
} = require("./testHelpers");

const { Role } = require("../model/model");

let adminFranchiseId;
let adminStoreId;
let franchiseId;
let storeId;

async function getUserFranchiseResponse() {
  const franchise = {
    name: randomName(),
    admins: [{ email: testUser.email }],
  };
  const franchiseRes = await request(app)
    .post("/api/franchise")
    .send(franchise)
    .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
  franchiseId = franchiseRes.body.id;
  return franchiseRes;
}

async function createTestUserStore() {
  const store = { franchiseId: franchiseId, name: randomName() };
  const storeRes = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .send(store)
    .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
  storeId = storeRes.body.id;
  return storeRes;
}

async function createAdminUserFranchise() {
  const franchise = {
    name: randomName(),
    admins: [{ email: getAdminUser().email }],
  };
  const franchiseRes = await request(app)
    .post("/api/franchise")
    .send(franchise)
    .set("Authorization", `Bearer ${getAdminUserAuthToken()}`);
  //console.log(franchiseRes.body);
  adminFranchiseId = franchiseRes.body.id;
  return franchiseRes;
}

async function createAdminUserStore() {
  const store = { franchiseId: adminFranchiseId, name: randomName() };
  const storeRes = await request(app)
    .post(`/api/franchise/${adminFranchiseId}/store`)
    .send(store)
    .set("Authorization", `Bearer ${getAdminUserAuthToken()}`);
  adminStoreId = storeRes.body.id;
  return storeRes;
}

describe("franchiseRouter", () => {
  beforeAll(async () => {
    await registerTestUser();
    await createAdminUser();
  });

  test("get franchises", async () => {
    const franchiseRes = await request(app).get("/api/franchise");
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toBeDefined();
  });

  test("get user franchises", async () => {
    await createAdminUserFranchise();
    const franchiseRes = await request(app)
      .get(`/api/franchise/${getTestUserId()}`)
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toMatchObject([]);
  });

  test("get user franchises bad auth", async () => {
    const franchiseRes = await request(app)
      .get(`/api/franchise/${randomName()}`)
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(franchiseRes.status).toBe(200);
  });

  test("create user franchises bad auth", async () => {
    const franchiseRes = await getUserFranchiseResponse();
    expect(franchiseRes.status).toBe(403);
  });

  test("delete admin franchise", async () => {
    const franchiseRes = await request(app)
      .delete(`/api/franchise/${adminFranchiseId}`)
      .set("Authorization", `Bearer ${getAdminUserAuthToken()}`);
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body.message).toBe("franchise deleted");
  });

  test("delete admin franchise bad auth", async () => {
    const franchiseRes = await request(app)
      .delete(`/api/franchise/${franchiseId}`)
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(franchiseRes.status).toBe(403);
  });

  test("create admin store", async () => {
    await createAdminUserFranchise();
    const storeRes = await createAdminUserStore();
    expect(storeRes.status).toBe(200);
  });

  test("create admin store bad id", async () => {
    const storeRes = await createTestUserStore();
    expect(storeRes.status).toBe(403);
  });

  test("delete admin store", async () => {
    const storeRes = await request(app)
      .delete(`/api/franchise/${adminFranchiseId}/store/${adminStoreId}`)
      .set("Authorization", `Bearer ${getAdminUserAuthToken()}`);
    expect(storeRes.status).toBe(200);
    expect(storeRes.body.message).toBe("store deleted");
  });

  test("delete admin store bad auth", async () => {
    const storeRes = await request(app)
      .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
      .set("Authorization", `Bearer ${getTestUserAuthToken()}`);
    expect(storeRes.status).toBe(403);
  });
});
