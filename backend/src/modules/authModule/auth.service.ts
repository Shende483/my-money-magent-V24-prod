import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';


@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}


  async findUserByEmail(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).lean().exec();
     console.log("udfh",user)
    if (!user || user.password !== password) {
      console.log("invalid data",email,password)
      return { error: 'Invalid email or password' };
    }

    return { access: user.access };  // 'user-access' or 'admin-access'
  }
}