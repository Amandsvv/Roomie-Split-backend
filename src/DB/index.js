import mongoose from 'mongoose';

const connectDB = async () =>{
    try {
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`MONGODB Connected || DB Host : ${conn.connection.host}`)
    } catch (error) {
        console.log("Error Found : ",error);
        process.exit(1);   
    }
}

export default connectDB;
