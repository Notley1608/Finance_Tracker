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
      { userIndex: 2, categoryName: "Groceries", colour: "#78face" },
      { userIndex: 2, categoryName: "Utilities", colour: "#6821c7" },
      { userIndex: 2, categoryName: "Travel", colour: "#ffffbb" },
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
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 68.45,
        description: "Weekly groceries",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 124.8,
        description: "Electricity bill",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 42.5,
        description: "Airport train",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 31.2,
        description: "Fruit and vegetables",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 79.99,
        description: "Internet bill",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 18.75,
        description: "Bus fare",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 54.3,
        description: "Supermarket supplies",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 45.6,
        description: "Water bill",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 135,
        description: "Hotel booking",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 22.9,
        description: "Bakery and snacks",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 59.95,
        description: "Mobile phone bill",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 12.5,
        description: "Train ticket",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 87.15,
        description: "Monthly grocery run",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 32.4,
        description: "Gas bill",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 76.2,
        description: "Taxi to station",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Groceries",
        amount: 43.75,
        description: "Household groceries",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Utilities",
        amount: 110,
        description: "Council utilities",
      },
      {
        userEmail: "test@example.com",
        categoryName: "Travel",
        amount: 29.95,
        description: "Rideshare trip",
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

      const categoryId = createdCategories.get(
        `${user.id}:${expense.categoryName}`,
      )?.id;
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
