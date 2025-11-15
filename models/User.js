const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database.json');

class User {
  constructor(username, email, password) {
    this.id = Date.now().toString();
    this.username = username;
    this.email = email;
    this.password = password;
    this.createdAt = new Date().toISOString();
  }

  static async findAll() {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data).users;
    } catch (error) {
      return [];
    }
  }

  static async findByEmail(email) {
    const users = await this.findAll();
    return users.find(user => user.email === email);
  }

  static async findByUsername(username) {
    const users = await this.findAll();
    return users.find(user => user.username === username);
  }

  static async findById(id) {
    const users = await this.findAll();
    return users.find(user => user.id === id);
  }

  async save() {
    const users = await User.findAll();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    users.push(this);
    
    const data = {
      users: users
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return this;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

module.exports = User;