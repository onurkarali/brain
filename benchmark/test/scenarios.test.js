/**
 * Tests for scenario evaluate.js modules.
 * Validates that each evaluator correctly scores sample outputs.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Scenario 1 — Continuity Evaluator', () => {
  const evaluate = require('../scenarios/scenario-1-continuity/evaluate');

  it('scores well-aligned output high', () => {
    const goodOutput = `
const express = require('express');
const router = express.Router();

const getPosts = async (req, res, next) => {
  try {
    const posts = await db.findAll();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await db.findById(id);
    res.json(post);
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, body } = req.body;
    const post = await db.create({ title, body });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

router.get('/', getPosts);
router.post('/', createPost);
module.exports = router;
    `;

    // Create workspace with the file
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s1-'));
    fs.mkdirSync(path.join(tmpDir, 'routes'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'routes', 'posts.js'), goodOutput);

    const result = evaluate.evaluate(tmpDir, [goodOutput], {});
    assert.ok(result.score >= 0.5, `Expected score >= 0.5, got ${result.score}`);
    assert.ok(result.success, 'Expected success');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('scores misaligned output low', () => {
    const badOutput = `
function getPosts(req, res) {
  db.findAll().then(function(posts) {
    res.json(posts);
  }).catch(function(err) {
    res.status(500).json({ error: err.message });
  });
}

module.exports.getPosts = getPosts;
    `;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s1-bad-'));
    const result = evaluate.evaluate(tmpDir, [badOutput], {});
    assert.ok(result.score < 0.7, `Expected score < 0.7, got ${result.score}`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('Scenario 2 — Consistency Evaluator', () => {
  const evaluate = require('../scenarios/scenario-2-consistency/evaluate');

  it('scores TypeScript output with style guide patterns high', () => {
    const tsOutput = `
import { z } from 'zod';

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
}

enum UserRole {
  Admin = 'admin',
  Member = 'member',
}

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

class UserService {
  private users: Map<string, User> = new Map();

  async create(input: unknown): Promise<User> {
    const validated = CreateUserSchema.parse(input);
    const user: User = { id: '1', ...validated };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}

export { User, UserRole, UserService, CreateUserSchema };
    `;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s2-'));
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'user-service.ts'), tsOutput);

    const result = evaluate.evaluate(tmpDir, [tsOutput], {});
    assert.ok(result.score >= 0.5, `Expected score >= 0.5, got ${result.score}`);
    assert.ok(result.success, 'Expected success');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('scores JS output with service pattern as passing', () => {
    const jsOutput = `
const { z } = require('zod');

const UserRole = { Admin: 'admin', Member: 'member' };

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

class UserService {
  #users = new Map();

  async create(input) {
    const validated = CreateUserSchema.parse(input);
    const user = { id: '1', ...validated };
    this.#users.set(user.id, user);
    return user;
  }

  async findById(id) { return this.#users.get(id); }
  async findAll() { return Array.from(this.#users.values()); }
  async delete(id) { return this.#users.delete(id); }
}

module.exports = { UserService, CreateUserSchema };
    `;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s2-js-'));
    fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'user-service.js'), jsOutput);

    const result = evaluate.evaluate(tmpDir, [jsOutput], {});
    assert.ok(result.success, `Expected success, got score ${result.score}`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('Scenario 4 — Error Learning Evaluator', () => {
  const evaluate = require('../scenarios/scenario-4-error-learning/evaluate');

  it('scores correct fix high', () => {
    const goodOutput = `
I identified a race condition in the processAll function. The issue is that
results.push(processed) inside Promise.all(map(...)) mutates shared state concurrently.

Fix: Use the return values of the mapped promises instead of pushing to a shared array.

const results = await Promise.all(items.map(async (item) => {
  return await processItem(item);
}));
    `;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s4-'));
    fs.writeFileSync(path.join(tmpDir, 'processor.js'), `
async function processAll(items) {
  const results = await Promise.all(items.map(async (item) => {
    return await processItem(item);
  }));
  return { results, errors: [], summary: { total: items.length, processed: results.length, failed: 0 } };
}
    `);

    const result = evaluate.evaluate(tmpDir, [goodOutput], {});
    assert.ok(result.score >= 0.5, `Expected score >= 0.5, got ${result.score}`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

describe('Scenario 5 — Preferences Evaluator', () => {
  const evaluate = require('../scenarios/scenario-5-preferences/evaluate');

  it('scores functional code high', () => {
    const goodOutput = `
const validateRecord = (record) => {
  if (!record.name) return { ok: false, error: 'Name required' };
  if (!record.email) return { ok: false, error: 'Email required' };
  return { ok: true, data: record };
};

const transformRecord = (record) => ({
  ...record,
  name: record.name.trim(),
  email: record.email.toLowerCase(),
});

const processPipeline = (records) => {
  const validated = records.map(validateRecord);
  const valid = validated.filter(r => r.ok).map(r => r.data);
  const transformed = valid.map(transformRecord);
  return Object.freeze({ results: transformed, total: records.length, valid: valid.length });
};
    `;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-s5-'));
    fs.writeFileSync(path.join(tmpDir, 'pipeline.js'), goodOutput);

    const result = evaluate.evaluate(tmpDir, [goodOutput], {});
    assert.ok(result.score >= 0.4, `Expected score >= 0.4, got ${result.score}`);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
