# URL shortener

## To create a short url, call:

```[yourdomain]/?url=http://example.com```

## Output

```{"original_url":"http://example.com", "short_url":"localhost:5000/{shortUrl}"}```

## To use:

Load `[yourdomain.com]/{shortUrl}` on your browser

will redirect to `http://www.example.com`

**Note:** The database is reinitialized when server starts.