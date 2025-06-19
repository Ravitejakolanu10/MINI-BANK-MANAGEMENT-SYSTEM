import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import pg from "pg";


const db = new pg.Client(
    {
        user : "postgres",
        password : "7008",
        host : "localhost",
        database : "Bank",
        port : 5432
    }
);
db.connect();

const app = express();
const port = 3000;

//uses
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.use(session({
    secret : 'Secret_Key',
    resave : false,
    saveUninitialized : true,
    cookie : {secure : false}
}))

app.get("/home", (req, res) => {
    res.render("home.ejs"); 
});

app.get("/loginpage", (req,res)=>{
    res.render("login.ejs");
})
app.get("/",(req,res)=>{
    res.render("login.ejs");
})

// Login Page

app.get("/login",async (req,res)=>{
    const user = req.query.username;
    const pass = parseInt(req.query.password);
    req.session.pin = pass;
    req.session.accountNumber = user;
    console.log(req.session.accountNumber);
    console.log(req.session.pin);
    try{
        const response = await db.query("SELECT (accountnumber) FROM users WHERE pin = $1 AND accountnumber = $2",[pass,user]);
        console.log(response.rows);
    

        if(response.rows.length != 0)
            {
                 res.render("home.ejs",{
                    error : null
            });
        }else{
            res.render("login.ejs",{
                error : "No user found with provided credentials."
             })
         console.log("no user Found");   
    }}
    catch(err)
    {
        console.log(err);
    }
})
// Check Balance
app.get("/check",async (req,res)=>{
    const accountnumber = req.session.accountNumber;
    const pin = req.session.pin;
    console.log(accountnumber);
    console.log(pin);

    if (!accountnumber) {
        console.log("No account number found in session.");
        return res.redirect("/loginpage"); // Redirect to login if not set
    }
    try{
        const response = await db.query("SELECT (amount) from users where accountnumber = $1 AND pin = $2",[accountnumber,pin]);
    console.log(response.rows);
    
    
    if(response.rows.length > 0)
    {
        const totalAmount = response.rows[0].amount;
        res.render("check.ejs",{
            balance : totalAmount,
        });
    }else{
        console.log("no money");
        
        res.render("check.ejs",{
            balance : null,
        });
    }
    }
    catch(err){
        console.log(err);   
    } 
});

// Deposit Money
app.get("/deposit", (req,res)=>{
    res.render("deposit.ejs");
})

app.post("/money", async(req,res)=>{
    const accountnumber = req.session.accountNumber;
    const pin = req.session.pin;
    console.log(accountnumber);
    const amount = parseInt(req.body.amount);

    if (isNaN(amount) && amount <= 0) {
        return res.send("Invalid amount.");
    }


    try{
        const result = await db.query('UPDATE users SET amount = amount + $1 WHERE accountnumber = $2 AND pin = $3',[amount,accountnumber,pin]);
        console.log(result.rows);
        
        res.redirect("/home");
        const response = await db.query("SELECT * FROM users WHERE accountnumber = $1",[accountnumber]);
        const data = response.rows;
        console.log(data);
        
        console.log("sucessfully");
        
    }catch(err)
    {
        console.log(err);
    }
})
// WithDrawl Money
app.get("/withdrawl", (req,res)=>{
    res.render("withdrawl.ejs");
})

app.post("/withdrawmoney", async(req,res)=>{
    const accountnumber = req.session.accountNumber;
    const pin = req.session.pin;
    console.log(accountnumber);
    const amount = parseInt(req.body.amount);

    if (isNaN(amount) && amount <= 0) {
        return res.send("Invalid amount.");
    }


    try{
        const result = await db.query('UPDATE users SET amount = amount - $1 WHERE accountnumber = $2 AND pin = $3',[amount,accountnumber,pin]);
        console.log(result.rows);
        
        res.redirect("/home");
        const response = await db.query("SELECT * FROM users WHERE accountnumber = $1",[accountnumber]);
        const data = response.rows;
        console.log(data);
        
        console.log("Withdrawl Sucessfully");
        
    }catch(err)
    {
        console.log(err);
    }
})
// Transfer Amount
app.get("/transfer", (req,res)=>{
    res.render("transfer.ejs");
})

app.post("/transfermoney", async(req,res)=>{
    const account = req.body.account;
    const amount = parseInt(req.body.amount);
    console.log(account);
    const accountnumber = req.session.accountNumber;
    const pin = req.session.pin;
    console.log(accountnumber);
    

    if (isNaN(amount) && amount <= 0) {
        return res.send("Invalid amount.");
    }


    try{
        const cutMoney = await db.query('UPDATE users SET amount = amount - $1 WHERE accountnumber = $2 AND pin = $3',[amount,accountnumber,pin])
        const result = await db.query('UPDATE users SET amount = amount + $1 WHERE accountnumber = $2 ',[amount,account]);
        console.log(result.rows);
        
        res.redirect("/home");
        const response = await db.query("SELECT * FROM users WHERE accountnumber = $1",[account]);
        const data = response.rows;
        console.log(data);
        
        console.log("Transfer Sucessfully");
        
    }catch(err)
    {
        console.log(err);
    }
})


// Create a New Account
app.get("/create",(req,res)=>{
    res.render("create.ejs",{
        account  : null
    });
})

app.post("/submit",async (req,res)=>{
    const firstName = req.body.fname;
    const lastName = req.body.lname;
    const email = req.body.email;
    const pinNumber = parseInt(req.body.pin);
    console.log(`First Name : ${firstName}`);
    console.log(`Last Name : ${lastName}`);
    console.log(`Email Address : ${email}`);
    console.log(`Pin Number : ${pinNumber}`);    
    
    const accountNumber = "1607227" + Math.floor(Math.random()*(999)+100);
    console.log(`Account Number : ${accountNumber}`);
    try{
    await db.query('INSERT INTO users(fname, lname, email, accountnumber, pin,amount) VALUES($1,$2,$3,$4,$5,$6)',[firstName,lastName,email,accountNumber,pinNumber,0]);

    const response = await db.query("SELECT * FROM users");
    console.log(response.rows);
    res.render("create.ejs", {
        account: `Account Created Successfully. Your Account Number is ${accountNumber}`
    });
    }catch(err)
    {
        console.log(err);
        res.render("create.ejs", {
            account: "An error occurred while creating the account."
        });
        
    }

})

app.listen(port , ()=>{
    console.log(`Server Running from ${port}`);
    
}) 