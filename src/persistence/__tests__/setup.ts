import 'fake-indexeddb/auto'
import { beforeEach } from 'vitest'

const DB_NAME = 'the-substrate-saves'

beforeEach(async () => {
  // Delete the test database before each test for isolation
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve() // Proceed even if blocked
  })
})
