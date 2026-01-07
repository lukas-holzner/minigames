import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">Minigames Hub</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/twister-wheel" className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border-2 border-gray-100 hover:border-blue-500">
                    <h2 className="text-2xl font-bold mb-2">Twister Wheel</h2>
                    <p className="text-gray-600">A customizable spinner for your Twister games.</p>
                </Link>
            </div>
        </div>
    );
}
