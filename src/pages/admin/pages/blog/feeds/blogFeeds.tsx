import React from "react";
import Link from "next/link";
import Image from "next/image";
import { UilFile, UilHeart } from "@iconscout/react-unicons";

interface BlogCardProps {
  item: {
    id: number;
    title: string;
    content: string;
    category: string;
    img: string;
    author: string;
    authorImg: string;
    postDate: string;
    favouriteBy: string;
    viewedBy: string;
  };
  theme?: "style-1" | "style-2" | "style-3";
  path: string;
  slug: string;
  title: string;
  content: string;
}

const BlogCard: React.FC<BlogCardProps> = ({
  item,
  theme = "style-1",
  path,
  slug,
  title,
  content,
}) => {
  return (
    <figure className="group p-6 mb-0 bg-white dark:bg-white/10 rounded-10 shadow-regular dark:shadow-none">
      <div className="relative after:absolute after:h-0 after:w-full ltr:after:left-0 rtl:after:right-0 after:top-0 after:bg-[#0a0a0a15] after:rounded-10 after:transition-all after:duration-300 group-hover:after:h-full"></div>
      <figcaption>
        {theme === "style-1" ? (
          <div className="flex justify-between items-center mt-2.5">
            <span className="inline-block text-light dark:text-white/60 text-15">
              {item.postDate}
            </span>
          </div>
        ) : theme === "style-2" ? (
          <div className="flex justify-between items-center mt-2.5">
            <span className="inline-block text-light dark:text-white/60 text-15">
              {item.category}
            </span>
            <span className="inline-block text-light dark:text-white/60 text-15">
              {item.postDate}
            </span>
          </div>
        ) : theme === "style-3" ? (
          <div className="flex justify-between items-center mt-2.5">
            <span className="inline-block m-1 text-light dark:text-white/60 text-15">
              {item.postDate}
            </span>
            <span className="relative inline-block m-1 ltr:pl-2.5 rtl:pr-2.5 text-light dark:text-white/60 text-15 before:absolute before:h-1 before:w-1 ltr:before:left-0 rtl:before:right-0 before:top-1/2 before:-translate-y-1/2 before:bg-light before:rounded-full">
              {item.category}
            </span>
            <span className="relative inline-block m-1 ltr:pl-2.5 rtl:pr-2.5 text-light dark:text-white/60 text-15 before:absolute before:h-1 before:w-1 ltr:before:left-0 rtl:before:right-0 before:top-1/2 before:-translate-y-1/2 before:bg-light dark:before:bg-white/10 before:rounded-full">
              6 mins read
            </span>
          </div>
        ) : null}
        <h2 className="mt-4 mb-3 text-xl font-semibold">
          <Link
            href={`${path}/${slug}`}
            className="text-dark hover:text-primary dark:text-white/[.87] dark:hover:text-primary"
          >
            {title}
          </Link>
        </h2>
        <p className="mb-4 text-base text-dark dark:text-white/[.87]">
          {content}
        </p>
        <div className="flex justify-between">
          <div className="flex items-center gap-x-4">
            <Image
              className="rounded-full max-w-[32px]"
              src="/hexadash-nextjs/img/chat-author/t1.jpg"
              alt=""
              width={32}
              height={32}
            />
            <span className="text-light dark:text-white/60 text-15">
              {item.author}
            </span>
          </div>
          <ul className="flex items-center -m-2">
            <li className="m-2">
              <span className="flex items-center leading-none gap-x-1 text-light dark:text-white/60 text-13">
                <UilHeart className="w-3 h-3 text-light dark:text-white/60" />
                <span className="flex items-center leading-none text-light dark:text-white/60 text-13">
                  {item.favouriteBy}
                </span>
              </span>
            </li>
            <li className="m-2">
              <span className="flex items-center leading-none gap-x-1 text-light dark:text-white/60 text-13">
                <UilFile className="w-3 h-3 text-light dark:text-white/60" />
                <span className="flex items-center leading-none text-light dark:text-white/60 text-13">
                  {item.viewedBy}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </figcaption>
    </figure>
  );
};

export default BlogCard;
