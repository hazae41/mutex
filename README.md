# Mutex

Just a mutex

```bash
npm i @hazae41/mutex
```

[**Node Package 📦**](https://www.npmjs.com/package/@hazae41/future)

## Features

### Current features
- 100% TypeScript and ESM
- No external dependencies
- Unit-tested

## Usage

```typescript
import { Future } from "@hazae41/mutex"

const mutex = new Mutex()

async function first() {
  await mutex.lock(async () => {
    // do stuff
  })
}

async function second() {
  await mutex.lock(async () => {
    // do stuff
  })
}

async function watcher() {
  await mutex.promise
  // do stuff without lock
}

first()
second()
watcher()
```
