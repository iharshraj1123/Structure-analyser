let KI=0;
let K_matrix=math.zeros(2,2);
let D_matrix=math.zeros(3,1)
let Q_matrix=math.zeros(3,1)
let Q_matrix_extraload=math.zeros(3,1)
let eqn_matrix=[];
let matrix_variables=[];
let eq_Matrix1=[];
let eq_Matrix2=[];
let eq_Matrix3=[];
let final_result_matrix;
let k_matrix_arr=[]
//const matrix = math.matrix([[7, 1], [-2, 3]])
/*
D_matrix or Q_matrix = 
[]1 (x)
[]2 (y)
[]3 (z)
[]4 (x)
[]5 (y)
[]6 (z)

K_matrix=
 1(x) 2(y) 3(z)
[              ] 1(x)
[              ] 2(y)
[              ] 3(z)

  KIxKI     KIx1
[Matrix1]*[Matrix2]=[Matrix3]

  1  2  3  4  5  6  7 8 9
[                         ] 
[                         ]
[                         ]
[                         ]
[                         ]
[                         ]

*/
function sti_solve(){
    k_matrix_arr=["local stiffness matrices"]
    let eqn_matrix=[];
    matrix_variables=[];
    eq_Matrix2=[];
    eq_Matrix3=[];
    final_result_matrix=[];
    KI = (node_database.length-1)*3
    K_matrix = math.zeros(KI,KI)
    D_matrix = math.zeros(KI,1)
    Q_matrix = math.zeros(KI,1)
    eq_Matrix1 = math.zeros(KI,KI)
    eq_Matrix2=[]
    Q_matrix_extraload = math.zeros(KI,1)
    for(let i=1;i<node_database.length;i++){
        let node=node_database[i]
        if(node.support == "none" || node.support == null){
            console.log("no support, i="+i)
            D_matrix._data[((i-1)*3)][0] = `D${((i-1)*3)+1}`
            D_matrix._data[((i-1)*3)+1][0] = `D${((i-1)*3)+2}`
            D_matrix._data[((i-1)*3)+2][0] = `D${((i-1)*3)+3}`
            Q_adder(i,"none")
        }
        else if(node.support == "roller"){
            console.log("roller support, i="+i)
            Q_adder(i,"roller")
            D_matrix._data[((i-1)*3)][0] = `D${((i-1)*3)+1}`
            D_matrix._data[((i-1)*3)+2][0] = `D${((i-1)*3)+3}`
        }
        else if(node.support == "pinned"){
            console.log("pinned support, i="+i)
            D_matrix._data[((i-1)*3)+2][0] = `D${((i-1)*3)+3}`
            Q_adder(i,"pinned")
        }
        else if(node.support == "fixed"){
            console.log("fixed support, i="+i)
            Q_adder(i,"fixed")
        }
    }

    //let member_no = member_database.length-1;

    for(let i=1;i<member_database.length;i++){
        let memb = member_database[i];
        let L = parseFloat(memb.length);
        let A= parseFloat(memb.A); //A in mm2
        let E= parseFloat(memb.E); //E in GPa, 1Gpa = 1000 N/mm2
        let I= parseFloat(memb.I); //I in mm4
        //A = 6000;E=200;I=180
        let lem_x= getlemda_x(memb.x2,memb.x1,L)
        let lem_y= getlemda_y(memb.y2,memb.y1,L)
        let sqlx = Math.pow(lem_x, 2);
        let sqly = Math.pow(lem_y, 2);
        let AEL = A*E*100/L  //KN/m
        let EIL12 = (12*E*I/Math.pow(L,3))/100  //KN/m
        let EIL6 = (6*E*I/Math.pow(L,2))/100   //KN
        let EIL2 = (2*E*I/L)/100    //KNm
        let EIL4 = (4*E*I/L)/100    //KNm
        let k11 = AEL*sqlx+EIL12*sqly
        let k22 = AEL*sqly+EIL12*sqlx
        let k12 = (AEL-EIL12)*lem_x*lem_y

        let k_matrix = math.matrix([[k11, k12,-EIL6*lem_y,-k11,-k12,-EIL6*lem_y], [k12,k22,EIL6*lem_x,-k12,-k22,EIL6*lem_x],[-EIL6*lem_y,EIL6*lem_x,EIL4,EIL6*lem_y,-EIL6*lem_x,EIL2],[-k11,-k12,EIL6*lem_y,k11,k12,EIL6*lem_y],[-k12,-k22,-EIL6*lem_x,k12,k22,-EIL6*lem_x],[-EIL6*lem_y,EIL6*lem_x,EIL2,EIL6*lem_y,-EIL6*lem_x,EIL4]])
        k_matrix_arr.push(k_matrix)
        console.log({member:i,k_matrix:k_matrix,lem_x:lem_x,lem_y:lem_y,L:L,A:A,E:E,I:I,AEL:AEL,EIL12:EIL12,EIL6:EIL6,EIL4:EIL4,EIL2:EIL2})
        let memb_node1 = parseInt(memb.node1)
        let memb_node2 = parseInt(memb.node2)
        let memb_node1_range = [memb_node1*3-2,memb_node1*3-1,memb_node1*3]
        let memb_node2_range = [memb_node2*3-2,memb_node2*3-1,memb_node2*3]
        let smallest_row = KI-1
        let smallest_col = KI-1
        let gap=0;
        let gap2=0;
        let last_row=0;
        let last_col=0;
        let is_first_loop=true;
        for(let col_no=1;col_no<KI+1;col_no++) {
            if(memb_node1_range.includes(col_no) || memb_node2_range.includes(col_no)){
                for(let row_no=1;row_no<KI+1;row_no++){
                    if(memb_node1_range.includes(row_no) || memb_node2_range.includes(row_no)){
                        if(row_no-1 < smallest_row) smallest_row = row_no-1
                        if(col_no-1 < smallest_col) smallest_col = col_no-1
                        if(row_no-1-last_row>1&&!is_first_loop) gap=row_no-1-last_row-1
                        if(col_no-1-last_col>1&&!is_first_loop) gap2=col_no-1-last_col-1
                        if(last_col!=col_no-1) gap=0
                        // if(last_row!=row_no-1) gap=0
                        // console.log({calc:row_no-1-smallest_row-(gap),gap:gap,last_row:last_row,col_no:col_no,row_no:row_no,smallest_col:smallest_col,smallest_row:smallest_row})
                        K_matrix._data[row_no-1][col_no-1] += k_matrix._data[row_no-1-smallest_row-(gap)][col_no-1-smallest_col-(gap2)]
                        last_row=row_no-1;
                        last_col=col_no-1;
                        is_first_loop=false
                    }
                }
            }
        }
    }

    eqn_matrix = matrix_eqn(Q_matrix._data,add_matrix(multiply_matrix(K_matrix._data,D_matrix._data),Q_matrix_extraload._data));
    final_result_matrix = math.lusolve(eq_Matrix1, eq_Matrix3)
    console.log("final_result_matrix")
    console.log(final_result_matrix)

    result_div.innerHTML = "<br><h3>Results</h3>" + giveMatrix(combine_matrix_results(eq_Matrix2,final_result_matrix._data))
    result_div.innerHTML += "<br><h3>K_matrix</h3>" + giveMatrix(K_matrix._data)
    result_div.innerHTML += "<h3>Q_matrix</h3>" + giveMatrix(Q_matrix._data)
    result_div.innerHTML += "<h3>D_matrix</h3>" + giveMatrix(D_matrix._data)
    result_div.innerHTML += "<h3>Q_matrix_extraload</h3>" + giveMatrix(Q_matrix_extraload._data)
    result_div.innerHTML += "<br><h3>(Q=K&times;D+Qextra)_matrix</h3>" + giveMatrix(eqn_matrix)
    for(let i=1;i<k_matrix_arr.length;i++){
        result_div.innerHTML += `<br><h3>member${i} k_matrix</h3>` + giveMatrix(k_matrix_arr[i]._data)
    }

    reResultTable()
    for(let i=0;i<eq_Matrix2.length;i++){
        let tempos = eq_Matrix2[i][0]
        if(tempos.includes("Q")){
            tempos= parseInt(tempos.slice(1))
            let temps_magn = final_result_matrix._data[i][0]
            let temp_cx = node_database[get_nodeno(tempos)].cx
            let temp_cy = node_database[get_nodeno(tempos)].cy
            if(tempos%3==1) add_rnx("pointLoad",temp_cx,temp_cy,temps_magn,"horizontal")
            else if(tempos%3==2) add_rnx("pointLoad",temp_cx,temp_cy,temps_magn,"vert")
            else add_rnx("concMoment",temp_cx,temp_cy,temps_magn)
        }
    } 
}

function get_nodeno(last_char){
    //if(hinges_arr.length==0){
        if(last_char%3 ==0){
            return last_char/3
        }
        else{
           return ((last_char-(last_char%3))/3)+1
        }
    //}
}

function add_rnx(type,temp_cx,temp_cy,magn,direc){
    magn = Math.round(magn*1000)/1000
    magn = `${magn}`
    temp_cx= parseInt(temp_cx)
    temp_cy= parseInt(temp_cy)
    if(type=="pointLoad"){
        if(direc=="vert"){
            if(magn<0) rxn_grp.innerHTML+=`<g transform="translate(${temp_cx} ${temp_cy + 65})"><text x="20" y="-21" class="svg-magn-rxn-text">${magn.slice(1)} KN</text><line x1="0" y1="-40" x2="0" y2="-13" class="load-force-react"></line><polygon points="-6.5,-14 6.5,-14 0,0" class="load-force-head-react"></polygon></g>`
            else if(magn>0) rxn_grp.innerHTML+=`<g transform="translate(${temp_cx} ${temp_cy + 65})"><text x="20" y="-21" class="svg-magn-rxn-text">${magn} KN</text><line x1="0" y1="0" x2="0" y2="-27" class="load-force-react"></line><polygon points="-6.5,-26 6.5,-26 0,-40" class="load-force-head-react"></polygon></g>`
        }
        else{
            if(magn>0) rxn_grp.innerHTML+=`<g transform="rotate(90 ${temp_cx-15} ${temp_cy +10}) translate(${temp_cx} ${temp_cy +50})"><text x="8" y="-20" class="svg-magn-rxn-text">${magn} KN</text><line x1="0" y1="0" x2="0" y2="-27" class="load-force-react"></line><polygon points="-6.5,-26 6.5,-26 0,-40" class="load-force-head-react"></polygon></g>`
            else if(magn<0) rxn_grp.innerHTML+=`<g transform="rotate(90 ${temp_cx-15} ${temp_cy +10}) translate(${temp_cx} ${temp_cy+50})"><text x="8" y="-20" class="svg-magn-rxn-text">${magn.slice(1)} KN</text><line x1="0" y1="-40" x2="0" y2="-13" class="load-force-react"></line><polygon points="-6.5,-14 6.5,-14 0,0" class="load-force-head-react"></polygon></g>`
        }
    }
    else{
        if(magn>0){
            rxn_grp.innerHTML+=`<g transform="translate(${temp_cx} ${temp_cy})"><path d="M-24 0A24 24 0 0 0 21.6 10.4 " class="load-force-react" transform="rotate(180 0 0)"></path><polygon points="-15.6,-7.7 -27.6,-13.3 -28,2" class="load-force-head-react"></polygon><text x="20" y="-21" class="svg-magn-rxn-text">${magn} KNm</text></g>`
        }
        else{
            rxn_grp.innerHTML+=`<g transform="translate(${temp_cx} ${temp_cy})"><polygon points="15.6,-7.6 27.6,-13.3 28,2" class="load-force-head-react"></polygon><path d="M24 0A24 24 0 0 1 -21.6 10.4 " class="load-force-react" transform="rotate(180 0 0)"></path><text x="20" y="-21" class="svg-magn-rxn-text">${magn.slice(1)} KNm</text></g>`
        }
    }
}

function combine_matrix_results(vars,res){
    let temp_matrix=[];
    for(let i=0;i<vars.length;i++){
        let temp_res = res[i];
        let temp_var = vars[i];
        if(typeof(vars[0])=="object"){
            if(typeof(res[0])=="object"){
                temp_matrix.push([`${spit_var(temp_var[0])} = ${temp_res[0]}${spit_units(temp_var[0])}`])
            }
            else temp_matrix.push([`${spit_var(temp_var[0])} = ${temp_res}${spit_units(temp_var[0])}`])
        }
        else{
            if(typeof(res[0])=="object"){
                temp_matrix.push([`${spit_var(temp_var)} = ${temp_res[0]}${spit_units(temp_var)}`])
            }
            else {temp_matrix.push([`${spit_var(temp_var)} = ${temp_res}${spit_units(temp_var)}`])}
        }
    }
    return temp_matrix;
}

function spit_var(x){
    let last_char = parseInt(x.slice(1))
    if(last_char%3 ==0){
        if(x.includes("Q")||x.includes("q")){
            x=x.replace("Q",`node${last_char/3}, M(↺)`);x=x.slice(0, -1)
        }
        else{
            x=x.replace("D",`node${last_char/3}, Dz`);x=x.slice(0, -1)
        }
    }
    else{
        if(x.includes("Q")||x.includes("q")){
            if(last_char%3==2) {x=x.replace("Q",`node${(last_char-(last_char%3))/3+1}, V(↑)`);x=x.slice(0, -1)}
            else {x=x.replace("Q",`node${(last_char-(last_char%3))/3+1}, H(→)`);x=x.slice(0, -1)}
        }
        else{
            if(last_char%3==2) {x=x.replace("D",`node${(last_char-(last_char%3))/3+1}, Dy`);x=x.slice(0, -1)}
            else {x=x.replace("D",`node${(last_char-(last_char%3))/3+1}, Dx`);x=x.slice(0, -1)}
        }
    }
    return x
}

function spit_units(x){
    if(x.includes("Q")||x.includes("q")){
        if(parseInt(x.charAt(x.length-1))%3 ==0) return " KNm"
        else return " KN"
    }
    else {
        return ""
    }
}

function multiply_matrix(x,y){
    let result_mat = []
    for(let rowno1=0;rowno1<x.length;rowno1++){
        let temp_res_row=[];
        for(let colno2=0;colno2<y[0].length;colno2++){
            let temp_sum = 0;
            for(let rowno2=0;rowno2<y.length;rowno2++){
                if(y[rowno2][colno2] != 0 && x[rowno1][rowno2] !=0){
                    let num1 = y[rowno2][colno2]
                    let num2 = x[rowno1][rowno2]
                    let isnum1 = typeof(y[rowno2][colno2])
                    let isnum2 = typeof(x[rowno1][rowno2])
                    if(isnum1=="number" && isnum2=="number") {
                        temp_sum += num2*num1
                    }
                    else {
                        if(temp_sum==0) temp_sum = `[!${x[rowno1][rowno2]}*${y[rowno2][colno2]}!]`
                        else temp_sum += `+ [!${x[rowno1][rowno2]}*${y[rowno2][colno2]}!]`
                    }
                }
            }
            temp_res_row.push(temp_sum)
        }
        result_mat.push(temp_res_row)
    }
    return result_mat;
}

function add_matrix(x,y){
    let result_mat = []
    for(let row_no=0;row_no<x.length;row_no++){
        let temp_row=[];
        for(let col_no=0;col_no<x[0].length;col_no++){
            let num1 = x[row_no][col_no]
            let num2 = y[row_no][col_no]
            let is_num1 = typeof(num1)
            let is_num2 = typeof(num2)
            if(is_num1=="number" && is_num2=="number") temp_row.push(num1 + num2)
            else if(num1 ==0) temp_row.push(num2)
            else if(num2 ==0) temp_row.push(num1)
            else if(is_num1=="number"){
                if(num2.includes("[!")) temp_row.push(`[!${num1}!]+${num2}`)
                else temp_row.push(`[!${num1}!]+[!${num2}!]`)
            }
            else if(is_num2=="number"){
                if(num1.includes("[!")) temp_row.push(`${num1}+[!${num2}!]`)
                else temp_row.push(`[!${num1}!]+[!${num2}!]`)
            }
            else{ 
                if(num1.includes("[!") && !num2.includes("[!")) temp_row.push(`${num1}+[!${num2}!]`)
                if(num2.includes("[!")  && !num1.includes("[!")) temp_row.push(`[!${num1}!]+${num2}`)
                temp_row.push(`${num1}+${num2}`)
            }
        }
        result_mat.push(temp_row)
    }
    return result_mat;
}

function matrix_eqn(x,y){
    console.log({matrix_eqn_y:y})
    let matrix_variable_symbols=[];
    let temp_gmatrix=[];
    for(let i=0;i<x.length;i++){
        let lhs = `${x[i][0]}`
        let rhs = y[i][0];
        if(is_number(rhs)) rhs = "[!"+rhs+"!]"
        // let extras = Q_matrix_extraload._data[i][0]
        if(!is_number(lhs)){
            rhs = rhs + "+[!-"+lhs+"!]"
            lhs = 0
            eq_Matrix3[i]=0;
        }
        else{
            if(lhs<0.00000001&&lhs>-0.000000001) lhs = 0;
            eq_Matrix3[i]=lhs;
        }
        let temp_mat = rhs.match(/(?<=\[!)(.*?)(?=\!])/g);
        // console.log({temp_mat:temp_mat})
        let temp_vars = []
        for(let j=0;j<temp_mat.length;j++){
            let temp_nums = temp_mat[j].split("*")
            if(temp_nums.length>1){
                if(is_number(temp_nums[0])){
                    temp_vars.push([parseFloat(temp_nums[0]),temp_nums[1]])
                    matrix_variable_symbols.push(temp_nums[1])
                }
                else{
                    temp_vars.push([parseFloat(temp_nums[1]),temp_nums[0]])
                    matrix_variable_symbols.push(temp_nums[0])
                }
            }
            else if(is_number(temp_nums[0])){
                eq_Matrix3[i] = eq_Matrix3[i] - temp_nums[0]
            }
            else{
                if(temp_nums[0].charAt(0)=="-") {let temp_wiwi=temp_nums[0].slice(1); temp_vars.push([-1,temp_wiwi]);matrix_variable_symbols.push(temp_wiwi)}
                else {temp_vars.push([1,temp_nums[0]]);matrix_variable_symbols.push(temp_nums[0])}
            }
        }
        // eq_Matrix3[i] -= extras 
        matrix_variables.push(temp_vars)
        let lhs_show = lhs
        let rhs_show = rhs.replaceAll('[!', '')
        rhs_show = rhs_show.replaceAll('!]', '')

        temp_gmatrix.push([`${lhs_show}=${rhs_show}`])
    }
    matrix_variable_symbols = spit_uniques(matrix_variable_symbols)
    for(let ji=0;ji<matrix_variable_symbols.length;ji++){
        eq_Matrix2.push([matrix_variable_symbols[ji]])
    }
    for(let row_no=0;row_no<KI;row_no++){
        let temp_row = matrix_variables[row_no];
        for(let var_no=0;var_no<temp_row.length;var_no++){
            eq_Matrix1._data[row_no][matrix_variable_symbols.indexOf(temp_row[var_no][1])] = temp_row[var_no][0]
        }
    }
    console.log("eq_Matrix1=")
    console.log(eq_Matrix1._data)
    console.log("eq_Matrix2=")
    console.log(eq_Matrix2)
    console.log("eq_Matrix3=")
    console.log(eq_Matrix3)
    return temp_gmatrix;
}

function spit_uniques(x){
    return x.filter(onlyUnique)
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function is_number(x){
    if(x==0){
        return true
    }
    else{
        if (!Number(x)) return false
        else return true
    }
}

function getlemda_x(x2,x1,l){
    x1 = (parseInt(x1)/one_unit)/2
    x2 = (parseInt(x2)/one_unit)/2
    return (x2-x1)/parseFloat(l)
}
function getlemda_y(y2,y1,l){
    y1 = (parseInt(y1)/one_unit)/2
    y2 = (parseInt(y2)/one_unit)/2
    return -1*(y2-y1)/parseFloat(l)
}

function Q_adder(i,supp){
    //console.log({Q_adder_i:i,Q_adder_supp:supp})
    let node = node_database[i]
    if(supp=="none"){
        //free end or joints
        if(node.pointLoad != "none" && node.pointLoad != null){
            console.log("point load on node"+i)
            let angle = node.pointLoad.direc || 90;
            Q_matrix._data[((i-1)*3)][0] = -1*node.pointLoad.magnitude*math.cos(math.unit(angle, 'deg'))
            Q_matrix._data[((i-1)*3)+1][0] = -1*node.pointLoad.magnitude*math.sin(math.unit(angle, 'deg'))
            // math.subset(Q_matrix, math.index(((i-1)*3), 0), -1*node.pointLoad.magnitude*math.cos(math.unit(angle, 'deg')))
        }
        if(node.concMoment != "none" && node.concMoment != null){
            console.log("concMoment load on node"+i)
            Q_matrix._data[((i-1)*3)+2][0] = node.concMoment.magnitude
        }
    }
    else{
        if(node.pointLoad != "none" && node.pointLoad != null){
            console.log("node"+i+" had extra point load")
            let angle = node.pointLoad.direc || 90;
            Q_matrix_extraload._data[((i-1)*3)][0] = Q_matrix_extraload._data[((i-1)*3)][0]+node.pointLoad.magnitude*math.cos(math.unit(angle, 'deg'))
            Q_matrix_extraload._data[((i-1)*3+1)][0] = Q_matrix_extraload._data[((i-1)*3+1)][0]+node.pointLoad.magnitude*math.sin(math.unit(angle, 'deg'))   
        }
        if(supp=="pinned"){
            Q_matrix._data[((i-1)*3)][0] = `Q${((i-1)*3)+1}`
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("concMoment load on node"+i)
                Q_matrix._data[((i-1)*3)+2][0] = -1*node.concMoment.magnitude
            }
        }
        else if(supp=="roller"){
            //rxn only in y-direction
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("concMoment load on node"+i)
                Q_matrix._data[((i-1)*3)+2][0] = -1*node.concMoment.magnitude
            }
        }
        else if(supp=="fixed"){
            //rxn in all 3 axis
            Q_matrix._data[((i-1)*3)][0] = `Q${((i-1)*3)+1}`
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            Q_matrix._data[((i-1)*3)+2][0] = `Q${((i-1)*3)+3}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("extra concMoment load on node"+i)
                //+1 for example 15.4
                Q_matrix_extraload._data[((i-1)*3)+2][0] = -1*node.concMoment.magnitude
            }
        }
        // else if(supp=="hinge"){
            
        // }
    }
}

function giveMatrix(x){
    let row_no = x.length;
    let col_no = x[0].length;
    let table_insides ="";
    for(let i=0;i< row_no+1;i++){
        table_insides += "<tr class='matrix-tr'>"
        for(let j=0;j< col_no+1;j++){
            if(i!=0){
                if(j!=0){
                    let temp_wrd= x[i-1][j-1]
                    if(typeof(temp_wrd)=="number"){
                        if(x[i-1][j-1] < 0.00001 && x[i-1][j-1] > -0.00001) x[i-1][j-1] = 0
                        x[i-1][j-1] = Math.round(x[i-1][j-1] * 1000) / 1000
                    }
                    table_insides += `<td class="matrix-td matrix-td-only">${x[i-1][j-1]}</td>`
                }
                else{
                    table_insides += `<th class="matrix-td">${i}</th>`
                }
            }
            else{
                if(j!=0) table_insides += `<th class="matrix-td">${j}</th>`
                else table_insides += `<th class="matrix-td"></th>`
            }
        }
        table_insides += "</tr>"
    }

    return `<table class="matrix-table">${table_insides}</table>`
}

function reResultTable(){
    let table_td_arr=[]
    let table_tds = document.getElementsByClassName("matrix-td-only")
    for(let i=0;i<KI;i++){
        let node_num= table_tds[i].textContent.charAt(4)
        if(!table_td_arr[node_num]) table_td_arr[node_num] = [table_tds[i].textContent]
        else table_td_arr[node_num].push(table_tds[i].textContent)
    }
    for(let j=1;j<table_td_arr.length;j++){
        for(let z=0;z<table_td_arr[j].length;z++){
            table_tds[(j-1)*3+z].textContent = table_td_arr[j][z]
        }
    }
}