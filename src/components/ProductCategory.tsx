import React from 'react';

const ProductCategory: React.FC = () => {
    return (
        <section className="px-4 md:px-8 mt-6" aria-labelledby="category-heading">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 border-b border-slate-300 pb-4">
                    <h2 id="category-heading" className="text-2xl font-bold text-slate-900">
                        Categorias
                    </h2>
                </div>

                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 sm:gap-8 gap-4 gap-y-8">
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-1.webp" alt="Sunscreen"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Sunscreen</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-2.webp" alt="Face Wash"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Face Wash</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-3.webp" alt="Skin Glow"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Skin Glow</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-4.webp" alt="Dry Shampoo"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Dry Shampoo</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-5.webp" alt="Body Butter"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Body Butter</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/sunscreen-img-6.webp" alt="Face Primer"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Face Primer</h3>
                            </div>
                        </a>
                    </li>
                    <li>
                        <a href="#" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
                            <div className="overflow-hidden aspect-square">
                                <img src="https://readymadeui.com/images/body-motion-category.webp" alt="Body Lotion"
                                    className="h-full w-full object-cover object-top rounded-xl" />
                            </div>
                            <div className="mt-4 text-center">
                                <h3 className="text-slate-900 text-sm font-semibold">Body Lotion</h3>
                            </div>
                        </a>
                    </li>

                </ul>
            </div>
        </section>
    );
};
  
export default ProductCategory;