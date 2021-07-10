# Adding redirects in MDN

MDN has a series of redirects, defined in the file
[`_redirects.txt`](https://github.com/mdn/content/blob/main/files/en-us/_redirects.txt)
in the `content` repo.

Each line contains a single redirect, in the form:

```bash
FROM-URL  TO-URL
```

The relative URL to redirect from, followed by a tab character, followed by the
relative URL to redirect to. A real example is as follows:

```bash
/en-US/docs/AJAX  /en-US/docs/Web/Guide/AJAX
```

Once built, the Yari system then puts all of these redirects in place.

The recommended way to add redirects correctly while avoiding errors is to use
the `add-redirect` tool available in the [`yari`](https://github.com/mdn/yari)
and [`content`](https://github.com/mdn/content) repos. Let's see how to use this.

## Preparation

### To run add-redirect from the yari repo

- First of all fork and locally clone the `yari` and `content` repos. If you
  already have some of them cloned locally, make sure they are up-to-date
  (e.g. `fetch` the updated content from the origin repos).
- Install the latest toolset in the `yari` repo using `yarn install`.
- Create a new branch in the `content` repo, and check
  it out locally.
- `cd` into your `yari` repo.

#### Adding the right environment variable to yari

Make sure to add the absolute path to your `content` repos' `files` directory to
the `CONTENT_ROOT` environment variable in `yari`.

The best way to do this is by setting that value in an `.env` file inside your
`yari` repo.

This can be done by running the following line inside the root of the yari
directory:

```bash
echo 'CONTENT_ROOT=/path/to/content/files' >> .env
```

Note: If an `.env` file does not already exist, it will be created automatically
when the above line runs.

### To run add-redirect from the content repo

- First of all fork and locally clone the `content` repo. If you
  already have it cloned locally, make sure it is up-to-date
  (e.g. `fetch` the updated content from the origin repos).
- Install the latest toolset using `yarn install`.
- Create a new branch in the `content` repo, and check
  it out locally.
- `cd` into your `content` repo.

## Adding a redirect

The `add-redirect` tool has the following syntax structure.

Inside `yari`:

```bash
yarn tool add-redirect <from> <to>
```

Inside `content`:

```bash
yarn content add-redirect <from> <to>
```

- `<from>` is the relative URL to redirect from.
- `<to>` is the relative URL to redirect to.

So if we wanted to redirect from `/en-US/docs/Thunderbird/Autoconfiguration` to
`/en-US/docs/Mozilla/Thunderbird/Autoconfiguration`, we'd run the following
command in `yari`:

```bash
yarn tool add-redirect /en-US/docs/Thunderbird/Autoconfiguration /en-US/docs/Mozilla/Thunderbird/Autoconfiguration
```

Or this in `content`:

```bash
yarn content add-redirect /en-US/docs/Thunderbird/Autoconfiguration /en-US/docs/Mozilla/Thunderbird/Autoconfiguration
```

This creates the right entry in the `content` repo's `_redirects.txt` file, and
sets everything up for you. You can then create a PR as desired.
