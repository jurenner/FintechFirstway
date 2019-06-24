const usuarios = require('./usuarios.js');
const anexos = require('./anexos.js');
const jtoken = require('./token.js');

const express = require('express');

var port = process.env.PORT || 3000;
const app = express();
const TOKEN = 'dGVzdGU6MTIz'; // teste 123

var dateFormat = require('dateformat');

// app.use(express.json());

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies
//app.use('/validaConta', express.json());

console.log('Start..');
app.get('/usuarios', 
       (req, resp)=> {
              if(hasAuthorization(req)){
                     console.log("/usuarios");
                     resp.status(200).send(usuarios);
              }else{
                     semAutorizacao(req, resp);
              }
       }
       );

app.get('/usuarios/pj', 
       (req, resp)=> {
              if(hasAuthorization(req)){
                     console.log("/usuarios/pj");
                     resp.status(200).send(usuarios.filter(usuario => usuario.cnpj !== undefined));
              }else{
                     semAutorizacao(req, resp);
              }
       });

app.get('/usuarios/pj/:cnpj', 
       (req, resp)=> {
              if(hasAuthorization(req)){
                     console.log('/usuarios/pj/'+req.params.cnpj);
                     let usuario;
                     for(let i=0;i<usuarios.length;i++){
                            if(usuarios[i].cnpj==req.params.cnpj){
                                   usuario = usuarios[i];
                                   break;
                            }
                            
                     }

                     if(usuario == undefined || usuario == null){
                            console.log("Usuário não encontrado!");
                            resp.status(500).send("Usuário não encontrado!");
                     } else {
                            resp.status(200).send(usuario);
                     }
       
              }else{
                     semAutorizacao(req, resp);
              }
       });

app.get('/anexos/:documento/:id', 
       (req, resp)=> {
              console.log('/anexos/{documento}/{id}');
              if(hasAuthorization(req)){
                     console.log('/anexos/'+req.params.documento+"/"+req.params.id);
                     let a;
                     for(let i=0;i<anexos.length;i++){
                            if(anexos[i].documento==req.params.documento && anexos[i].id==req.params.id){
                                   a = anexos[i];
                                   break;
                            }
                            
                     }
                     if(a==undefined || a==null){
                            console.log(".. Anexo nao encontrado...");
                            resp.status(500).send("Anexo nao encontrado!");
                     } else {
                            console.log(a.id+" documento:"+a.documento+" tipo: "+a.tipo);
                            resp.status(200).send(a);
                     }
              }else{
                     semAutorizacao(req, resp);
              }
       });


app.get('/usuarios/pj/:cnpj/anexos', 
       (req, resp)=> {
              if(hasAuthorization(req)){
                     console.log("/usuarios/pj/"+req.params.cnpj+"/anexos");
                     resp.status(200).send(usuarios.filter(usuario => usuario.cnpj === req.params.cnpj)[0].anexos);
              }else{
                     semAutorizacao(req, resp);
              }
       });

app.get('/usuarios/pj/:cnpj/anexos/:anexo', 
       (req, resp)=> {
              if(hasAuthorization(req)){
                     console.log("/usuarios/pj/"+req.params.cnpj+"/anexos/"+req.params.anexo);
                     resp.status(200).send(
                            usuarios.filter(usuario => usuario.cnpj === req.params.cnpj)[0]
                            .anexos.filter(anexo => anexo.nome === req.params.anexo));
              }else{
                     semAutorizacao(req, resp);
              }
       });

app.post('/login', 
       (req, resp)=> {
              console.log("/login "+req.body.username+"("+req.body.password+")");
              if(req.body.username === 'teste' && req.body.password === '123'){
                     resp.status(200).send({token: TOKEN});
              }else {
                     semAutorizacao(req, resp);
              }
       });

semAutorizacao = 
       (req, resp) => {
              let auth = 'Authorization';
              
              if(req.headers[auth] === undefined){
                     auth = auth.toLowerCase();
              }

              const msg = auth+" invalida! ["+req.headers[auth]+"]";
              console.log(msg);
              resp.status(401).send(msg);
       }

hasAuthorization = 
       (req) =>{
              let auth = 'Authorization';
              
              if(req.headers[auth] === undefined){
                     auth = auth.toLowerCase();
              }
              if(req.headers[auth] === 'Basic '+ TOKEN ) {
                     console.log("[Basic "+ TOKEN+"]");
                     return true;
              }
              if(req.headers[auth] === jtoken.token_type+" "+jtoken.access_token){
                     console.log(" ["+jtoken.token_type+" "+jtoken.access_token);
                     return true;
                 
              }
              const keyToken = jtoken.token_type+" "+jtoken.access_token;
              if(req.headers[auth].substring(0,31) === keyToken.substring(0,31)){
                     console.log(" Validando periodo!");
                     const strData = req.headers[auth].substring(31,41);
                     console.log("Cabec "+req.headers[auth]);
                     console.log("Cabec "+req.headers[auth].substring(0,31));
                     const now = new Date();
                     const ano = "20"+strData.substring(0,2);
                     const mes = strData.substring(2,4);
                     const dia = strData.substring(4,6);
                     const hora = strData.substring(6,8);
                     const minuto = strData.substring(8,10);
                     console.log(" StrData "+ano+"-"+mes+"-"+
                                   dia+" "+
                                   hora+":"+
                                   minuto+" "); 

                     let dt = new Date(ano+"-"+mes+"-"+dia+" "+hora+":"+minuto+":00");
                     console.log(dateFormat(dt, "dd/mm/yyyy HH:MM"));       
                     dt.setSeconds(dt.getSeconds()+3600);     
                     console.log(dateFormat(dt, "dd/mm/yyyy HH:MM"));       
                     return now<=dt;
                 
              }

       }

app.post('/auth/oauth/v1/token', 
       (req, resp)=> {
              console.log("/auth/oauth/v1/token ");
              console.dir(req.body);
              console.log("--------------------------");
              if(req.body.client_id==='resource.jalmeida' &&
                     req.body.client_secret==='teste' &&
                     req.body.grant_type==='client_credentials'){
                     console.log("Ok! "+req.body.client_id);
                     let ktoken = jtoken;
                     const now = new Date();
                     console.log(" Date "+dateFormat(now, "yymmddHHMM"))

                     ktoken.access_token = jtoken.access_token.substring(0,24)+dateFormat(now, "yymmddHHMM")+"bd";
                     console.dir(jtoken);
                     console.log("============");
                     console.dir(ktoken);
                     resp.status(200).send(jtoken);
              } else {
                     console.log("NOk!");
                     resp.status(401).send('Usuário ou senha invalidos');
              }
              console.log("--------------------------");
       }
       );


       app.post('/validaConta', 
              (req, resp)=> {
                     
                     if(hasAuthorization(req)){
                            console.log("Result ");
                            console.log(req.body);
                            console.log("--------------------------");
                            const res_data = req.body;
                            let retorno = '{ "numeroProtocolo": "'+res_data.numeroProtocolo+
                                          '", "statusConta": "'+res_data.statusRelacionamento+
                                          '", "dataInicio":"'+res_data.dataInicio+
                                          '", "dataFim:" :';
                            if(res_data.dataFim===null) {
                                   retorno +='null';
                            } else {
                                   retorno +='"'+res_data.dataFim+'"';
                            }
                            retorno += ' , "statusProcessamento": "Confirmado", '+
                                          '"idProcessamento": 1234567890 } ';
                            console.log(" Agencia/Conta: "+res_data.numeroAgencia+" / "+res_data.numeroConta);
                            console.log(" Protocolo: "+res_data.numeroProtocolo);
                            console.log(" Status: "+res_data.statusRelacionamento+" - "+res_data.dataInicio +" a "+res_data.dataFim);
                            let pessoas = res_data.pessoas;
                            for(let i=0;i<pessoas.length;i++){
                                   console.log(" Pessoa/Documento: "+pessoas[i].nome+" / "+pessoas[i].numeroDocumento);
                            }
                           
                            resp.status(200).send(retorno);
                            //resp.status(200).send(usuarios);
                     }else{
                            semAutorizacao(req, resp);
                     }
              }
              );
       

app.listen(port);
