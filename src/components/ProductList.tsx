import React from 'react';

export const ProductList: React.FC = () => {
    return (
        <section className="mt-6 px-4 md:px-8" aria-labelledby="products-heading">
            <div className="max-w-7xl mx-auto">
                <div className="border-b border-slate-300 pb-4 mb-8 md:mb-12">
                    <h2 id="products-heading" className="text-2xl font-bold text-slate-900">Populares</h2>
                    <p className="text-base text-slate-600 mt-2">Confira os produtos mais populares e tendenciosos.</p>
                </div>

                <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-1.webp" alt="sunscreen"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">Skin
                                Glow Combo</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 4 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(102)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$11.00</span>$8.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-2.webp" alt="Crystal Glow"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">Crystal
                                Glow</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 4 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(100)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$14.00</span>$9.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-3.webp" alt="Lancome La Base"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">Lancome
                                La Base</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 3 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(90)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$11.00</span>$7.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-4.webp" alt="HD Face Primer"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">HD Face
                                Primer</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 5 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(102)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$16.00</span>$12.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-5.webp" alt="Sunscreen Gel"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">
                                Sunscreen Gel</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 4 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(102)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$18.00</span>$12.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/sunscreen-img-6.webp" alt="Watermelon Sunscreen"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">
                                Watermelon Sunscreen</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 4 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(102)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$20.00</span>$14.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/aloederm-cream-img-1.webp" alt="Aloederm Body Cream"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">Aloederm
                                Body Cream</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 3 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(200)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$22.00</span>$14.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col items-center mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                    <li
                        className="flex flex-col border border-slate-300 shadow-sm rounded-md p-1.5 transition-all relative overflow-hidden">
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                        <div className="w-full bg-slate-50 rounded-sm overflow-hidden">
                            <img src="https://readymadeui.com/images/aloederm-cream-img-2.webp" alt="Aloederm Face Cream"
                                className="w-full aspect-square object-cover object-top" />
                        </div>

                        <div className="py-4 px-2 text-left">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2">Aloederm
                                Face Cream</h3>
                            <div className="flex items-center flex-wrap gap-3 mt-2">
                                <div className="flex justify-center gap-2" role="img" aria-label="Rated 4 out of 5 stars">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#ffc107]" viewBox="0 0 24 24"
                                    aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-[#CED5D8]"
                                    viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                        d="m23.363 8.584-7.378-1.127L12.678.413c-.247-.526-1.11-.526-1.357 0L8.015 7.457.637 8.584a.75.75 0 0 0-.423 1.265l5.36 5.494-1.267 7.767a.75.75 0 0 0 1.103.777L12 20.245l6.59 3.643a.75.75 0 0 0 1.103-.777l-1.267-7.767 5.36-5.494a.75.75 0 0 0-.423-1.266z"
                                        data-original="#ffc107" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600">(88)</p>
                            </div>

                            <div className="mt-4">
                                <p className="text-slate-900 font-semibold text-sm sm:text-base break-words">
                                    <span className="mr-1.5">MRP:</span><span
                                    className="mr-1.5 text-slate-600">$20.00</span>$12.00
                                </p>
                            </div>
                        </div>
                        </a>
                        <div className="flex flex-col mt-2">
                        <button type="button"
                            className="w-full cursor-pointer text-sm px-3.5 py-2 font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Add
                            to Bag</button>
                        <button type="button"
                            className="w-full flex items-center justify-center gap-2 pb-1.5 pt-3 cursor-pointer text-sm text-slate-900 font-medium whitespace-nowrap rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-current" viewBox="0 0 66 66"
                                aria-hidden="true">
                                <path
                                    d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                                    data-original="#000000">
                                </path>
                            </svg>
                            <span>Add to wishlist</span></button>
                        </div>
                    </li>

                </ul>
            </div>
            </section>
    )
}

export default ProductList