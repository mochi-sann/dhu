import chalk from "chalk";
import pkg from "@dhu/cli/package.json";

const w = chalk.white;
const y = chalk.yellow;
const orange = chalk.rgb(233, 99, 29);

// generated by https://github.com/jpetitcolas/ascii-art-converter
// prettier-ignore
const logo = orange(`
                         ,:::,             
                        :{ujt-:            
                     I|Oavi                
                  ;n*#h},                  
      ,i10#aOcYLJqhaO-                     
     IrQb#dx{<:                            ${y.bold("dhu")}
          :;l-jCkadJt_:                    ${w(`version: ${pkg.version}`)}
             ,>JMMMM#m_                    
           ,}Z#MMMMMU:                     ${w("Have a nice day!")}
         :tkMMMMM#ZuLaokpJ/~,              
       !XMMMMMM#w!      :{wMMMM*On]i:      ${y.bold("To contribute:")}
     -Q#MMMMM#m-         ;J#MMMMMMMMLI     ${w("@see https://github.com/rainy-me/dhu")}
    _kMMMMMMo[,         ,|*MMMMMMMMML;     
       Itpq1,           >kMMMMMMMMMMJ,     
                       ,ZMMMMMMMMMMMz      
                       vMMMMMMMMMMM#n      ${w("made with ♡")}
                      ;bMMMMMMMMMMM*f      
                       ,|Lb#MMMMMMM*(      
                           I?npMMMMo}      
                               ,I{r+       
`);

export const renderLogo = () => {
  console.log(logo);
};
