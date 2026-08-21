import { db } from "./db";
import { UserModel } from "./models/user.model";
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
      { email: "test@example.com", password: "Test123!" },
    ];

    const createdUsers = [];
    for (const user of usersToSeed) {
      const existingUser = await userModel.findByEmail(user.email);
      const createdUser =
        existingUser ?? (await userModel.create(user.email, user.password));

      if (createdUser) {
        createdUsers.push(createdUser);
        if (!existingUser) {
          console.log(`Inserted user: ${user.email}`);
        } else {
          console.log(`Using existing user: ${user.email}`);
        }
      }
    }

    // 2. Seed Categories per user using real user IDs
    const categoriesToSeed = [
      { userIndex: 2, categoryName: "Groceries" },
      { userIndex: 2, categoryName: "Utilities" },
      { userIndex: 2, categoryName: "Travel" },
    ];

    const createdCategories = new Map<
      string,
      { id: string; name: string; userId: string }
    >();
    for (const cat of categoriesToSeed) {
      const user = createdUsers[cat.userIndex];
      if (user) {
        const existingCategory = await categoryModel.findByName(
          user.id,
          cat.categoryName,
        );
        const createdCat =
          existingCategory ??
          (await categoryModel.create(cat.categoryName, user.id));

        if (createdCat) {
          const key = `${user.id}:${createdCat.name}`;
          createdCategories.set(key, {
            id: createdCat.id,
            name: createdCat.name,
            userId: user.id,
          });

          if (!existingCategory) {
            console.log(
              `Inserted category '${cat.categoryName}' for user ${user.email}`,
            );
          } else {
            console.log(
              `Using existing category '${cat.categoryName}' for user ${user.email}`,
            );
          }
        }
      }
    }

    // 3. Seed Expenses using real user and category IDs
    const expensesToSeed = [
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 25,
        description: "Supermarket",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 500,
        description: "Air ticket",
      },
    ];

    for (const expense of expensesToSeed) {
      const user = createdUsers.find(
        (item) => item.email === expense.userEmail,
      );
      if (!user) {
        console.warn(
          `Skipping expense '${expense.description}' because user was not found`,
        );
        continue;
      }

      const categoryId = createdCategories.get(`${user.id}:${expense.categoryName}`)?.id;
      if (!categoryId) {
        console.warn(
          `Skipping expense '${expense.description}' because category '${expense.categoryName}' was not found for user ${user.email}`,
        );
        continue;
      }

      const existingExpenses = await expenseModel.findAllByUserId(user.id);
      const alreadyExists = existingExpenses?.some(
        (item) =>
          item.currentDescription === expense.description &&
          item.rawAmount === expense.amount,
      );

      if (alreadyExists) {
        console.log(`Expense already exists: ${expense.description}`);
        continue;
      }

      const createdExpense = await expenseModel.create(
        expense.amount,
        user.id,
        categoryId,
        expense.description,
        new Date().toISOString(),
      );

      if (createdExpense) {
        console.log(`Inserted expense: ${expense.description}`);
      } else {
        console.error(`Failed to insert expense: ${expense.description}`);
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
