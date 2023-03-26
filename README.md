# djshs
## for [djshs site](https://djshs.kr)

### 1. How to install
```bash
$ npm install djshs
```

### 2. How to use

#### 1. create client
```javascript
const djshs = require('djshs');
const client = new djshs.Client();
```
or in typescript
```typescript
import { Client } from 'djshs';
const client = new Client();
```

#### 2. login
```javascript
client.login(20221302, 'password'); // student id, password
```

#### 3. get sutdent data
```javascript
client.getStudentInfo().then(data => {
    console.log(data);
});
```

#### 4. submit study location
```javascript
client.roomSubmit(17, 1, client.getCurrDate()) // room_id, time, date
```

#### 5. get points
```javascript
client.getPoint(1).then(data => { // grade
    console.log(data);
});
```

#### 6. get total points
```javascript
client.getTotalPoint(1).then(data => { // grade
    console.log(data);
});
```
