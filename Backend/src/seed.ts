import { db } from "./db";
import { UserModel } from "./models/user.model";        // Your user model
import { CategoryModel } from "./models/category.model";
import { ExpenseModel } from "./models/expense.model";

async function seed() {
  const userModel = new UserModel(db);
  const categoryModel = new CategoryModel(db);
  const expenseModel = new ExpenseModel(db);

  try {
    console.log("Seeding database...");

    // 1. Seed Users and capture their IDs
    const usersToSeed = [
      { email: "alice@example.com", password: "HashedPw1!" },
      { email: "bob@example.com", password: "HashedPw1!" },
      { email: "test@example.com", password: "Test123!" }
    ];

    const createdUsers = [];
    for (const user of usersToSeed) {
      const createdUser = await userModel.create(user.email, user.password);
      if (createdUser) {
        createdUsers.push(createdUser);
        console.log(`Inserted user: ${user.email}`);
      }
    }

    // 2. Seed Categories per user using real user IDs
    const categoriesToSeed = [
      { userIndex: 0, name: "Groceries" },
      { userIndex: 0, name: "Utilities" },
      { userIndex: 1, name: "Travel" },
    ];

    const createdCategories = [];
    for (const cat of categoriesToSeed) {
      const user = createdUsers[cat.userIndex];
      if (user) {
        const createdCat = await categoryModel.create(cat.name, user.id);
        if (createdCat) {
          createdCategories.push(createdCat);
          console.log(`Inserted category '${cat.name}' for user ${user.email}`);
        }
      }
    }

    // 3. Seed Expenses using real user and category IDs
    const expensesToSeed = [
      {
        categoryIndex: 0,
        amount: 2500,
        description: "Supermarket",
      },
      {
        categoryIndex: 2,
        amount: 50000,
        description: "Air ticket",
      },
    ];

    for (const expense of expensesToSeed) {
      const cat = createdCategories[expense.categoryIndex];
      if (cat) {
        await expenseModel.create(
          expense.amount,
          cat.user_id,
          cat.id,
          expense.description,
          new Date().toISOString(),
        );
        console.log(`Inserted expense: ${expense.description}`);
      }
    }

    console.log("Seeding finished successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}

// Run seeding script
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });