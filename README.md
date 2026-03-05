# Монгол Хөрөнгийн Тооцоолуур (React + Vite + Tailwind + Supabase)

## 1) Ажиллуулах

```bash
npm install
npm run dev
```

## 2) Supabase холбох

1. Supabase дээр шинэ project үүсгэнэ.
2. SQL Editor дээр дараах хүснэгтийг үүсгэнэ:

```sql
create table if not exists salary_data (
  id bigint generated always as identity primary key,
  nas int not null,
  alban text not null,
  company text not null,
  salary bigint not null,
  mashin bigint not null,
  bair bigint not null,
  created_at timestamp with time zone default now()
);
```

3. Authentication хэрэггүй (anonymous submission).
4. Project Settings -> API хэсгээс URL болон anon key авна.
5. `.env.example`-г `.env` болгож хуулж, утгуудыг бөглөнө:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 3) Netlify-д deploy хийх

1. Кодоо GitHub руу push хийнэ.
2. Netlify дээр Add new site -> Import from Git.
3. Build тохиргоо:
- Build command: `npm run build`
- Publish directory: `dist`
4. Netlify Site configuration -> Environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
5. Deploy дарна.

## 4) Тайлбар

- Формын өгөгдөл `salary_data` хүснэгт рүү шууд хадгалагдана.
- Үр дүнгийн хувь нь `src/data/percentiles.json` доторх dummy өгөгдлөөс тооцогдоно.
- Бүх текст Монгол хэл дээр байна.
