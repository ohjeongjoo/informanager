const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        message: '사용자명과 비밀번호를 입력해주세요.'
      });
    }
    
    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      });
    }
    
    // 비밀번호 검증
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: '잘못된 사용자명 또는 비밀번호입니다.'
      });
    }
    
    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        total: user.total,
        headquarters: user.headquarters,
        team: user.team
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        total: user.total,
        headquarters: user.headquarters,
        team: user.team,
        position: user.position,
        isWorking: user.isWorking
      }
    });
    
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      message: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// 회원가입 (관리자만)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone, role, total, headquarters, team, position } = req.body;
    
    // 필수 필드 검증
    if (!username || !password || !name || !phone || !total || !headquarters || !team || !position) {
      return res.status(400).json({
        message: '모든 필수 필드를 입력해주세요.'
      });
    }
    
    // 사용자명 중복 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: '이미 존재하는 사용자명입니다.'
      });
    }
    
    // 새 사용자 생성
    const newUser = new User({
      username,
      password,
      name,
      phone,
      role: role || 'staff',
      total,
      headquarters,
      team,
      position
    });
    
    await newUser.save();
    
    res.status(201).json({
      message: '사용자가 성공적으로 생성되었습니다.',
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        total: newUser.total,
        headquarters: newUser.headquarters,
        team: newUser.team,
        position: newUser.position
      }
    });
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      message: '회원가입 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        message: '토큰이 제공되지 않았습니다.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    res.json({
      message: '토큰이 유효합니다.',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        total: user.total,
        headquarters: user.headquarters,
        team: user.team,
        position: user.position,
        isWorking: user.isWorking
      }
    });
    
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(401).json({
      message: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = router;