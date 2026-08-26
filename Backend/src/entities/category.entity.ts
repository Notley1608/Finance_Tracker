export interface CategoryProperties {
  id: string;
  userId: string;
  name: string;
  expenseCount: number;
}

export class CategoryEntity {
  public id: string;
  public userId: string;
  public name: string;
  public expenseCount: number;

  constructor(properties: CategoryProperties) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.name = properties.name;
    this.expenseCount = properties.expenseCount;
  }

  public toObject() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      expenseCount: this.expenseCount,
    };
  }
}
