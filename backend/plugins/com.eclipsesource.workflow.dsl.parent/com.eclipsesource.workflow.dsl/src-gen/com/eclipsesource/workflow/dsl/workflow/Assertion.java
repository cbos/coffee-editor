/**
 * generated by Xtext 2.17.1
 */
package com.eclipsesource.workflow.dsl.workflow;

import org.eclipse.emf.ecore.EObject;

/**
 * <!-- begin-user-doc -->
 * A representation of the model object '<em><b>Assertion</b></em>'.
 * <!-- end-user-doc -->
 *
 * <p>
 * The following features are supported:
 * </p>
 * <ul>
 *   <li>{@link com.eclipsesource.workflow.dsl.workflow.Assertion#getBefore <em>Before</em>}</li>
 *   <li>{@link com.eclipsesource.workflow.dsl.workflow.Assertion#getAfter <em>After</em>}</li>
 * </ul>
 *
 * @see com.eclipsesource.workflow.dsl.workflow.WorkflowPackage#getAssertion()
 * @model
 * @generated
 */
public interface Assertion extends EObject
{
  /**
   * Returns the value of the '<em><b>Before</b></em>' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @return the value of the '<em>Before</em>' attribute.
   * @see #setBefore(String)
   * @see com.eclipsesource.workflow.dsl.workflow.WorkflowPackage#getAssertion_Before()
   * @model
   * @generated
   */
  String getBefore();

  /**
   * Sets the value of the '{@link com.eclipsesource.workflow.dsl.workflow.Assertion#getBefore <em>Before</em>}' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @param value the new value of the '<em>Before</em>' attribute.
   * @see #getBefore()
   * @generated
   */
  void setBefore(String value);

  /**
   * Returns the value of the '<em><b>After</b></em>' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @return the value of the '<em>After</em>' attribute.
   * @see #setAfter(String)
   * @see com.eclipsesource.workflow.dsl.workflow.WorkflowPackage#getAssertion_After()
   * @model
   * @generated
   */
  String getAfter();

  /**
   * Sets the value of the '{@link com.eclipsesource.workflow.dsl.workflow.Assertion#getAfter <em>After</em>}' attribute.
   * <!-- begin-user-doc -->
   * <!-- end-user-doc -->
   * @param value the new value of the '<em>After</em>' attribute.
   * @see #getAfter()
   * @generated
   */
  void setAfter(String value);

} // Assertion