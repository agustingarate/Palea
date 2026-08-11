import '@testing-library/jest-dom';
import process from 'node:process';

process.env.NEXT_PUBLIC_PALEA_ENV = 'development';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
