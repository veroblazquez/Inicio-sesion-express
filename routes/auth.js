const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        message: 'El usuario debe tener al menos 3 caracteres' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el usuario ya existe
    const existingUserByEmail = await User.findByEmail(email);
    const existingUserByUsername = await User.findByUsername(username);

    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({ 
        message: 'El usuario o email ya está registrado' 
      });
    }

    // Crear nuevo usuario
    const user = new User(username, email, password);
    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login de usuario - Ahora acepta usuario O email
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar que se proporcione usuario o email (pero no ambos)
    if ((!username && !email) || (username && email)) {
      return res.status(400).json({ 
        message: 'Proporciona solo usuario O email, no ambos' 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        message: 'La contraseña es requerida' 
      });
    }

    let user;

    // Buscar usuario por username o email
    if (username) {
      user = await User.findByUsername(username);
    } else {
      user = await User.findByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const userInstance = new User(user.username, user.email, user.password);
    userInstance.id = user.id;
    
    const isPasswordValid = await userInstance.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener perfil de usuario (protegido)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;