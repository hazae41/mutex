# Mutex

Rust-like Mutex for TypeScript

```bash
npm i @hazae41/mutex
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/mutex)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Similar to Rust
- Can hold data
- Unit-tested

## Usage

```typescript
import { Mutex } from "@hazae41/mutex"

const mutex = new Mutex(123)

async function first() {
  await mutex.lock(async (x) => {
    // do stuff with x
  })
}

async function second() {
  await mutex.lock(async (x) => {
    // do stuff with x
  })
}

async function third() {
  await mutex.tryLock(async (x) => {
    // do stuff with x
  }).unwrap()
}

first()
second()
third()
```
