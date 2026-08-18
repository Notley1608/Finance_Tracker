export interface CategoryProperties {
  categoryId: string;
  userId: string;
  name: string;
}

export class CategoryEntity {
  private categoryId: string;
  private userId: string;
  private name: string;

  constructor(properties: CategoryProperties) {
    this.categoryId = properties.categoryId;
    this.userId = properties.userId;
    this.name = properties.name;
  }

  get id() {
    return this.categoryId;
  }
  get categoryName() {
    return this.name;
  }
  get user_id() {
    return this.userId;
  }

  public toObject() {
    return {
      id: this.categoryId,
      name: this.name,
      userId: this.userId,
    };
  }
}
