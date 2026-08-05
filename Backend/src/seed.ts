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

    // 1. Seed Users
    const usersToSeed = [
      { email: "alice@example.com", password: "HashedPw1!" },
      { email: "bob@example.com", password: "HashedPw1!" },
      { email: "test@example.com", password: "Test123!" }
    ];

    for (const user of usersToSeed) {
      // Check if user already exists (optional)
      // Here you might want to implement a findByEmail method in your UserModel
      await userModel.create(user.email, user.password);
      console.log(`Inserted user: ${user.email} with password ${user.password}`);
    }

    // 2. Seed Categories per user
    const categoriesToSeed = [
      { userId: "uuid-user-1", name: "Groceries" },
      { userId: "uuid-user-1", name: "Utilities" },
      { userId: "uuid-user-2", name: "Travel" },
    ];

    for (const cat of categoriesToSeed) {
      await categoryModel.create(cat.name, cat.userId);
      console.log(`Inserted category '${cat.name}' for user ${cat.userId}`);
    }

    // 3. Seed Expenses per user/category
    // For this you ideally retrieve the category IDs after insert
    // But for simplicity, assume you know the IDs or generate UUIDs here

    const expensesToSeed = [
      {
        expenseId: "uuid-expense-1",
        userId: "uuid-user-1",
        categoryId: "category-id-for-groceries", // replace with real ids if you can retrieve them
        amount: 2500, // e.g. cents
        description: "Supermarket",
        date: new Date().toISOString(),
      },
      {
        expenseId: "uuid-expense-2",
        userId: "uuid-user-2",
        categoryId: "category-id-for-travel",
        amount: 50000,
        description: "Air ticket",
        date: new Date().toISOString(),
      },
    ];

    for (const expense of expensesToSeed) {
      await expenseModel.create(
        expense.amount,
        expense.userId,
        expense.categoryId,
        expense.description,
        expense.date,
      );
      console.log(`Inserted expense for user ${expense.userId} in category ${expense.categoryId}`);
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