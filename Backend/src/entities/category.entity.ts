export interface CategoryProperties {
  id: string;
  userId: string;
  name: string;
}

export class CategoryEntity {
  public id: string;
  public userId: string;
  public name: string;

  constructor(properties: CategoryProperties) {
    this.id = properties.id;
    this.userId = properties.userId;
    this.name = properties.name;
  }

  public toObject() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
    };
  }
}
