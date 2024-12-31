import Link from "next/link";
import Footer from "../app/components/Footer";

export default function Home() {
  return (
    <div>
      <ul>
        <li><Link href='/chat'>/chat</Link></li>
        <li><Link href='/detail/ghtomju'>/detail/ghtomju</Link></li>
        <li><Link href='/detail/mjutogh'>/detail/mjutogh</Link></li>
        <li><Link href='/taxi'>/taxi</Link></li>
      </ul>
      <Footer />
    </div>
  );
}
