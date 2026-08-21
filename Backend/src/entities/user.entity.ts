import { password as BunPassword } from "bun";

export interface UserProperties {
  userId: string;
  userEmail: string;
  userName: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class UserEntity {
  private userId: string;
  private userEmail: string;
  private userName: string;
  private passwordHash: string;
  private createdAt: string;
  private updatedAt: string;

  constructor(properties: UserProperties) {
    this.userId = properties.userId;
    this.userEmail = properties.userEmail;
    this.userName = properties.userName;
    this.passwordHash = properties.passwordHash;
    this.createdAt = properties.createdAt;
    this.updatedAt = properties.updatedAt;
  }

  get id() {
    return this.userId;
  }
  get email() {
    return this.userEmail;
  }
  get name() {
    return this.userName;
  }
  get created() {
    return this.createdAt;
  }
  get updated() {
    return this.updatedAt;
  }

  public toObject(): SafeUser {
    return {
      id: this.userId,
      email: this.email,
      name: this.userName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public async verifyPassword(password: string): Promise<boolean> {
    const isMatch: boolean = await BunPassword.verify(
      password,
      this.passwordHash,
    );
    return isMatch;
  }
}
