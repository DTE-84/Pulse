import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const userId = '7040c348-d62b-447e-b9f1-feb0ed26ee31';
const secret = process.env.JWT_SECRET;

const token = jwt.sign({ sub: userId }, secret);

async function testNova() {
  try {
    const res = await axios.post('http://localhost:3000/api/nova/chat', {
      message: "Hey Nova, what's my spending velocity looking like today?",
      history: []
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("NOVA RESPONSE:");
    console.log(res.data.content);
  } catch (err) {
    console.error("ERROR:");
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testNova();
