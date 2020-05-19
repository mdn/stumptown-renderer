import Link from "next/link";

export default function Homepage() {
  return (
    <div>
      <h2>Welcome to MDN</h2>
      <h3>
        HTML Elements (sample, <code>en-US</code>)
      </h3>
      <ul>
        <li>
          <Link href="/en-US/docs/Web/HTML/Element/audio">HTML/audio</Link>
        </li>
        <li>
          <Link href="/en-US/docs/Web/HTML/Element/video">HTML/video</Link>
        </li>
        <li>
          <Link href="/en-US/docs/Web/HTML/Element/canvas">HTML/canvas</Link>
        </li>
      </ul>
      <h3>
        HTML Elements (sample, <code>fr</code>)
      </h3>
      <ul>
        <li>
          <Link href="/fr/docs/Web/HTML/Element">HTML</Link>
        </li>
        <li>
          <Link href="/fr/docs/Web/HTML/Element/abbr">HTML/abbr</Link>
        </li>
        <li>
          <Link href="/fr/docs/Web/HTML/Element/video">HTML/video</Link>
        </li>
      </ul>
      <h3>Flaws</h3>
      <ul>
        <li>
          <Link href="/en-US/_flaws">All (en-US) flaws</Link>
        </li>
      </ul>
      <h3>HTML Guide Pages</h3>
      <ul>
        <li>
          <Link href="/en-US/docs/Web/HTML/Element">
            Index of HTML elements
          </Link>
        </li>
        <li>
          <Link href="/en-US/docs/Learn/HTML/Introduction_to_HTML">
            Introduction to HTML
          </Link>
        </li>
        <li>
          <Link href="/en-US/docs/Web/HTML/Applying_color">
            Applying color to HTML elements using CSS
          </Link>
        </li>
      </ul>
      <h3>JavaScript Reference</h3>
      <ul>
        <li>
          <Link href="/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt">
            BigInt
          </Link>
        </li>
      </ul>
    </div>
  );
}
