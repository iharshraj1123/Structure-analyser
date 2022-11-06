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
let number_indexes=[]
let word_indexes=[]
let final_result_matrix;
let rows_inc_by;
let var_Dmat;
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
    rows_inc_by=0
    number_indexes=[]
    word_indexes=[]
    let eqn_matrix=[];
    matrix_variables=[];
    // eq_Matrix2=[];
    // eq_Matrix3=[];
    //final_result_matrix=[];
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
        console.log({member:i,lem_x:lem_x,lem_y:lem_y,L:L,A:A,E:E,I:I,AEL:AEL,EIL12:EIL12,EIL6:EIL6,EIL4:EIL4,EIL2:EIL2})

        let k_matrix = math.matrix([[k11, k12,-EIL6*lem_y,-k11,-k12,-EIL6*lem_y], [k12,k22,EIL6*lem_x,-k12,-k22,EIL6*lem_x],[-EIL6*lem_y,EIL6*lem_x,EIL4,EIL6*lem_y,-EIL6*lem_x,EIL2],[-k11,-k12,EIL6*lem_y,k11,k12,EIL6*lem_y],[-k12,-k22,-EIL6*lem_x,k12,k22,-EIL6*lem_x],[-EIL6*lem_y,EIL6*lem_x,EIL2,EIL6*lem_y,-EIL6*lem_x,EIL4]])
        
        let memb_node1 = parseInt(memb.node1)
        let memb_node2 = parseInt(memb.node2)
        let memb_node1_range = [memb_node1*3-2,memb_node1*3-1,memb_node1*3]
        let memb_node2_range = [memb_node2*3-2,memb_node2*3-1,memb_node2*3]
        let smallest_row = KI-1
        let smallest_col = KI-1
        for(let col_no=1;col_no<KI+1;col_no++) {
            if(memb_node1_range.includes(col_no) || memb_node2_range.includes(col_no)){
                for(let row_no=1;row_no<KI+1;row_no++){
                    if(memb_node1_range.includes(row_no) || memb_node2_range.includes(row_no)){
                        if(row_no-1 < smallest_row) smallest_row = row_no-1
                        if(col_no-1 < smallest_col) smallest_col = col_no-1
                        K_matrix._data[row_no-1][col_no-1] += k_matrix._data[row_no-1-smallest_row][col_no-1-smallest_col]
                    }
                }
            }
        }
    }
    for(let i=0;i<KI;i++){
        if(is_number(Q_matrix._data[i][0])) number_indexes.push(i)
        else word_indexes.push(i)
    }
    //sorting so 0's on top
    for(let i=0;i<number_indexes.length;i++){
        let temproo = number_indexes.length-1-i
        if(number_indexes[temproo]>word_indexes[i]){
            exchange_rowcol(Q_matrix._data,number_indexes[temproo],word_indexes[i])
            exchange_rowcol(K_matrix._data,number_indexes[temproo],word_indexes[i])
            exchange_rowcol(D_matrix._data,number_indexes[temproo],word_indexes[i])
            exchange_rowcol(Q_matrix_extraload._data,number_indexes[temproo],word_indexes[i])
        }
    }
    number_indexes=[]
    word_indexes=[]
    for(let i=0;i<KI;i++){
        if(is_number(Q_matrix._data[i][0])) number_indexes.push(i)
    }
    solve_eqns()

    result_div.innerHTML = "<br><h3>K_matrix</h3>" + giveMatrix(K_matrix._data)
    result_div.innerHTML += "<h3>Q_matrix</h3>" + giveMatrix(Q_matrix._data)
    result_div.innerHTML += "<h3>D_matrix</h3>" + giveMatrix(D_matrix._data)
    // eqn_matrix = matrix_eqn(Q_matrix._data,add_matrix(multiply_matrix(K_matrix._data,D_matrix._data),Q_matrix_extraload._data));
    // final_result_matrix = math.lusolve(eq_Matrix1, eq_Matrix3)
    // console.log("final_result_matrix")
    // console.log(final_result_matrix)

    // result_div.innerHTML = "<br><h3>Results</h3>" + giveMatrix(combine_matrix_results(eq_Matrix2,final_result_matrix._data))
    // result_div.innerHTML += "<br><h3>K_matrix</h3>" + giveMatrix(K_matrix._data)
    // result_div.innerHTML += "<h3>Q_matrix</h3>" + giveMatrix(Q_matrix._data)
    // result_div.innerHTML += "<h3>D_matrix</h3>" + giveMatrix(D_matrix._data)
    // result_div.innerHTML += "<h3>Q_matrix_extraload</h3>" + giveMatrix(Q_matrix_extraload._data)
    // result_div.innerHTML += "<br><h3>(Q=K&times;D+Qextra)_matrix</h3>" + giveMatrix(eqn_matrix)

    // reResultTable()
}
let d_soln;
let K_mat_bot;
function solve_eqns(){
    let last_top_index = number_indexes[number_indexes.length-1]
    let Q_mat_top = getMatrix_subset(Q_matrix,0,last_top_index,0,0)
    let Q_mat_bot = getMatrix_subset(Q_matrix,last_top_index+1,KI-1,0,0)
    let D_mat_top;
    //let D_mat_bot = getMatrix_subset(D_matrix,last_top_index+1,KI-1,0,0)
    let Qextra_mat_top = getMatrix_subset(Q_matrix_extraload,0,last_top_index,0,0)
    let Qextra_mat_bot = getMatrix_subset(Q_matrix_extraload,last_top_index+1,KI-1,0,0)
    let K_mat_top = getMatrix_subset(K_matrix,0,last_top_index,0,last_top_index)
    //let K_mat_bot;
    let K_rows = KI-last_top_index-2
    let K_cols = last_top_index

    console.log({Q_mat_top:Q_mat_top,K_mat_top:K_mat_top,K_mat_bot:K_mat_bot,})
    //console.log("soln=")
    //console.log(math.lusolve(K_mat_top,Q_mat_top))
    d_soln=math.lusolve(K_mat_top,Q_mat_top)
    let q_soln;
    var_Dmat = D_matrix._data;
    for(let i=0;i<d_soln._data.length;i++){
        D_matrix._data[i][0]=`${d_soln._data[i][0]}`
    }
    setTimeout(function(){
        for(let i=0;i<d_soln._data.length;i++){
            D_matrix._data[i][0]=parseFloat(D_matrix._data[i][0])
        }
    },0)

    //check if its subsetting K properly
    if(K_rows > K_cols) {
        //first case we will inc cols
        K_mat_bot = getMatrix_subset(K_matrix,last_top_index+1,KI-1,0,last_top_index+K_rows-K_cols);
        D_mat_top = getMatrix_subset(D_matrix,0,last_top_index+K_rows-K_cols,0,0);
        console.log({K_mat_bot:K_mat_bot,D_mat_top:D_mat_top})
    }
    else if(K_cols > K_rows) {
        //here we will inc rows
        rows_inc_by = K_cols-K_rows
        K_mat_bot = getMatrix_subset(K_matrix,last_top_index+1+K_rows-K_cols,KI-1,0,last_top_index);
        D_mat_top = getMatrix_subset(D_matrix,0,last_top_index,0,0);
    }
    else{
        K_mat_bot = getMatrix_subset(K_matrix,last_top_index+1,KI-1,0,last_top_index);
        D_mat_top = getMatrix_subset(D_matrix,0,last_top_index,0,0);
    }
    //q_soln=math.lusolve(K_mat_bot,D_mat_top)

    console.log({d_soln:d_soln,q_soln:q_soln})
}

function getMatrix_subset(mat,row1,row2,col1,col2){
    return math.subset(mat, math.index(math.range(row1,row2+1), math.range(col1,col2+1))) // pehla 3 col&row
}

function exchange_rowcol(mat,x,y){
    if(mat[0].length==1){
    //for columb matrices
        let temp_x = mat[x][0]
        let temp_y = mat[y][0]
        mat[x][0] = temp_y
        mat[y][0] = temp_x
    }
    else{
        //exchanging rows
        let temp_x = mat[x]
        let temp_y = mat[y]
        mat[x] = temp_y
        mat[y] = temp_x
        //in x row, changing col elements
        temp_x = mat[x][x]
        temp_y = mat[x][y]
        mat[x][x] = temp_y
        mat[x][y] = temp_x
        //in y row, changing col elements
        temp_x = mat[y][x]
        temp_y = mat[y][y]
        mat[y][x] = temp_y
        mat[y][y] = temp_x
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
    let last_char = parseInt(x.charAt(x.length-1))
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
            else temp_row.push(`[!${num1}!]+[!${num2}!]`)
        }
        result_mat.push(temp_row)
    }
    return result_mat;
}

function matrix_eqn(x,y){
    let matrix_variable_symbols=[];
    let temp_gmatrix=[];
    for(let i=0;i<x.length;i++){
        let lhs = `${x[i][0]}`
        let rhs = y[i][0];
        let extras = Q_matrix_extraload._data[i][0]
        if(!is_number(lhs)){
            rhs = rhs + "+[!-"+lhs+"!]"
            lhs = 0
            eq_Matrix3[i]=0;
        }
        else{
            if(lhs<0.000001&&lhs>-0.0000001) lhs = 0;
            eq_Matrix3[i]=lhs;
        }
        let temp_mat = rhs.match(/(?<=\[!)(.*?)(?=\!])/g);
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
        eq_Matrix3[i] -= extras 
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
    // console.log("matrix_variables=")
    // console.log(matrix_variables)
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
            Q_matrix_extraload._data[((i-1)*3)][0] = Q_matrix_extraload._data[((i-1)*3)][0]-1*node.pointLoad.magnitude*math.cos(math.unit(angle, 'deg'))
            Q_matrix_extraload._data[((i-1)*3+1)][0] = Q_matrix_extraload._data[((i-1)*3+1)][0]-1*node.pointLoad.magnitude*math.sin(math.unit(angle, 'deg'))   
        }
        if(supp=="pinned"){
            Q_matrix._data[((i-1)*3)][0] = `Q${((i-1)*3)+1}`
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("concMoment load on node"+i)
                Q_matrix._data[((i-1)*3)+2][0] = node.concMoment.magnitude
            }
        }
        else if(supp=="roller"){
            //rxn only in y-direction
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("concMoment load on node"+i)
                Q_matrix._data[((i-1)*3)+2][0] = node.concMoment.magnitude
            }
        }
        else if(supp=="fixed"){
            //rxn in all 3 axis
            Q_matrix._data[((i-1)*3)][0] = `Q${((i-1)*3)+1}`
            Q_matrix._data[((i-1)*3)+1][0] = `Q${((i-1)*3)+2}`
            Q_matrix._data[((i-1)*3)+2][0] = `Q${((i-1)*3)+3}`
            if(node.concMoment != "none" && node.concMoment != null){
                console.log("extra concMoment load on node"+i)
                Q_matrix_extraload._data[((i-1)*3)+2][0] = node.concMoment.magnitude
            }
        }
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

// function reResultTable(){
//     let table_td_arr=[]
//     let table_tds = document.getElementsByClassName("matrix-td-only")
//     for(let i=0;i<KI;i++){
//         let node_num= table_tds[i].textContent.charAt(4)
//         if(!table_td_arr[node_num]) table_td_arr[node_num] = [table_tds[i].textContent]
//         else table_td_arr[node_num].push(table_tds[i].textContent)
//     }
//     for(let j=1;j<table_td_arr.length;j++){
//         for(let z=0;z<table_td_arr[j].length;z++){
//             table_tds[(j-1)*3+z].textContent = table_td_arr[j][z]
//         }
//     }
// }