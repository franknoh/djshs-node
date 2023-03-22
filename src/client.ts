import paths from "./paths";
import fetch from "node-fetch";
import { parse } from 'node-html-parser';

interface Student {
    name: string;
    studentId: number;
    sex: '남' | '여';
    grade: number;
    class: number;
    number: number;
    tel: string;
    parentTel: string;
}

interface Point {
    date: string;
    point: number;
    reason: string;
    teacher: string;
    type: '상점' | '벌점';
    ptype: string;
}

export default class Client {
    public id: number = 0;
    public cookie: { [key: string]: string } = {};
    public headers: { [key: string]: string } = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        'Cache-Control': 'pre-check=0, post-check=0, max-age=0',
        'Connection': 'keep-alive',
        'Host': 'djshs.kr',
        'Referer-Policy': 'strict-origin-when-cross-origin',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': paths.base
    };

    constructor() {
    }

    public cookieString(): string {
        return Object.keys(this.cookie).map(key => `${key}=${this.cookie[key]}`).join("; ");
    }

    public getCurrDate(): string {
        let date = new Date();
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    }

    public async get(url: string, headers?: {[key:string]: string}): Promise<string> {
        return await fetch(url, {
            "headers": {
                ...this.headers,
                "cookie": this.cookieString(),
                'Referer': url,
                ...headers
            },
            "method": "GET"
        }).then(res => {
            let cookies = res.headers.get('set-cookie');
            if (cookies) {
                cookies.split(', ').forEach(cookie => {
                    cookie = cookie.split(';')[0];
                    if(!cookie.includes('='))
                        return;
                    let [key, value] = cookie.split('=');
                    this.cookie[key] = value;
                })
            }
            return res.text()
        })
    }

    public async post(url: string, body: string, headers?: {[key:string]: string}): Promise<string> {
        return await fetch(url, {
            "headers": {
                ...this.headers,
                "cookie": this.cookieString(),
                "Referer": url,
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                ...headers
            },
            "body": body,
            "method": "POST"
        }).then(res => {
            let cookies = res.headers.get('set-cookie');
            if (cookies) {
                cookies.split(', ').forEach(cookie => {
                    cookie = cookie.split(';')[0];
                    if(!cookie.includes('='))
                        return;
                    let [key, value] = cookie.split('=');
                    this.cookie[key] = value;
                })
            }
            return res.text()
        })
    }
    public async login(id: number, password: string): Promise<boolean> {
        await this.get(paths.base)
        await this.post(paths.login, `mb_id=${id}&mb_password=${password}`, {
            'Referer': paths.loginPage
        })
        let text = await this.get(paths.base)
        if(text.includes('로그아웃')){
            this.id = id;
        }
        return text.includes('로그아웃');
    }

    public async roomSubmit(room: number, time: number, date: string): Promise<void> {
        if (!this.id) {
            throw new Error('Not logged in')
        }
        await this.post(paths.room, `sdate=${date}&time=${time}&mb_id=${this.id}&cls_idx=${room}`)
    }

    public async roomCancel(time: number, date: string): Promise<void> {
        if (!this.id) {
            throw new Error('Not logged in')
        }
        await this.post(paths.roomCancel, `sdate=${date}&time=${time}&mb_id=${this.id}`)
    }

    public async getStudentInfo(): Promise<Student> {
        if (!this.id) {
            throw new Error('Not logged in')
        }
        let text = await this.get(paths.info);
        let data = parse(text).getElementById('fmodify').querySelectorAll('td');
        data.forEach(e=>{
            while (e.childNodes.length > 2) {
                e.removeChild(e.firstChild);
            }
        })
        return {
            'name': data[0].innerText.trim().substring(12),
            'studentId': parseInt(data[1].innerText.trim().substring(13)),
            'sex': data[2].innerText.trim().substring(12) as '남' | '여',
            'grade': parseInt(data[3].innerText.trim().substring(12)),
            'class': parseInt(data[4].innerText.trim().substring(11)),
            'number': parseInt(data[5].innerText.trim().substring(12)),
            'tel': data[6].innerText.trim().substring(16),
            'parentTel': data[7].innerText.trim().substring(17)
        }
    }

    public async getPoint(grade: number): Promise<Point[]> {
        if (!this.id) {
            throw new Error('Not logged in')
        }
        let text = await this.get(paths.point + grade);
        let data = parse(text).querySelectorAll('table')[7].querySelectorAll('tr');
        let result: Point[] = [];
        data.forEach(e => {
            result.push({
                'date': e.querySelectorAll('td')[0].innerText.trim(),
                'type': e.querySelectorAll('td')[1].innerText.trim() as '벌점' | '상점',
                'ptype': e.querySelectorAll('td')[2].innerText.trim(),
                'reason': e.querySelectorAll('td')[3].innerText.trim(),
                'point': parseInt(e.querySelectorAll('td')[4].innerText.trim()),
                'teacher': e.querySelectorAll('td')[5].innerText.trim()
            })
        })
        return result;
    }

    public async getTotalPoint(grade: number): Promise<number> {
        if (!this.id) {
            throw new Error('Not logged in')
        }
        let text = await this.get(paths.point + grade);
        return parseInt(parse(text).querySelectorAll('h5')[18].innerText.substring(9));
    }
}